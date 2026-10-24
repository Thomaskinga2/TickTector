// Forum checks. Run: npm test
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { beforeEach, test } from "node:test";
import sharp from "sharp";

// A post and photo saved by the old store (rounded lat/lng, one photoUrl, raw JPEG), already in memory when this
// version starts. The store migrates them on load, so they are planted before it is imported.
globalThis.__forumDb = {
  posts: [{ id: "legacy-1", townId: "amherst", lat: 42.37, lng: -72.52, title: "Old post", body: "Saved before post types", photoUrl: "/api/forum/photos/old", author: "Maya", createdAt: "2026-10-20T13:00:00.000Z" }],
  comments: [],
  photos: new Map([["old", new Uint8Array([0xff, 0xd8, 0xff, 0xd9])]]),
};
const { POST } = await import("@/app/api/forum/posts/route.ts");
const { SAMPLE_SCAN } = await import("@/lib/fixtures/sample-scan.ts");
const { cleanImage } = await import("@/lib/forum-images.ts");
const { getForumStore, townFromName } = await import("@/lib/providers/forum-store.ts");
const { MA_TOWNS } = await import("@/lib/providers/risk.ts");
const { createScanPost } = await import("@/lib/services/forum.ts");

const hasGps = (exif) => !!exif && (exif.includes(Buffer.from([0x88, 0x25])) || exif.includes(Buffer.from([0x25, 0x88]))); // GPSInfo tag

async function jpegWithGps() {
  return sharp({ create: { width: 64, height: 48, channels: 3, background: "#a1442b" } })
    .jpeg()
    .withExif({ IFD3: { GPSLatitudeRef: "N", GPSLatitude: "42/1 22/1 23/1", GPSLongitudeRef: "W", GPSLongitude: "72/1 31/1 11/1" } })
    .toBuffer();
}

// createScanPost runs in the browser; here fetch goes straight to the route handler, and other
// same-site paths (the fixture photo) are read from public/. `sent` keeps the last form it posted.
let sent;
beforeEach(() => {
  sent = undefined;
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    if (url === "/api/forum/posts") {
      sent = init.body;
      return POST(new Request(`http://test${url}`, init));
    }
    if (url.startsWith("/")) return new Response(readFileSync(`public${url}`));
    throw new Error(`Unexpected fetch: ${url}`);
  };
});

test("town -> county comes from the 351 Massachusetts cities and towns (US Census)", () => {
  assert.equal(MA_TOWNS.length, 351);
  assert.equal(new Set(MA_TOWNS.map((t) => t.county)).size, 14);
  assert.equal(townFromName("Amherst")?.county, "Hampshire");
  assert.equal(townFromName("  north adams ")?.county, "Berkshire");
  assert.equal(townFromName("manchester-by-the-sea")?.county, "Essex");
  assert.equal(townFromName("Nantucket")?.county, "Nantucket");
  assert.equal(townFromName("Boston")?.county, "Suffolk");
  assert.equal(townFromName("Hartford"), undefined);
  assert.equal(townFromName(""), undefined);
});

test("cleanImage removes all EXIF, GPS included", async () => {
  const input = await jpegWithGps();
  assert.ok(hasGps((await sharp(input).metadata()).exif), "the test image starts with GPS EXIF");

  const { bytes, type } = await cleanImage(new Blob([input]));
  assert.equal(type, "image/jpeg");
  assert.equal((await sharp(bytes).metadata()).exif, undefined);
  assert.ok(!bytes.includes(Buffer.from("Exif\0\0")), "no EXIF segment left in the file");
});

test("cleanImage accepts JPEG, PNG and WebP, rejects other files and anything over 10 MB", async () => {
  for (const format of ["png", "webp"]) {
    const img = await sharp({ create: { width: 8, height: 8, channels: 3, background: "#fff" } }).toFormat(format).toBuffer();
    assert.equal((await cleanImage(new Blob([img]))).type, `image/${format}`);
  }
  const gif = await sharp({ create: { width: 8, height: 8, channels: 3, background: "#fff" } }).gif().toBuffer();
  await assert.rejects(cleanImage(new Blob([gif], { type: "image/png" })), /Invalid image/);
  await assert.rejects(cleanImage(new Blob(["<script>alert(1)</script>"], { type: "image/jpeg" })), /Invalid image/);
  await assert.rejects(cleanImage(new Blob([new Uint8Array(10 * 1024 * 1024 + 1)], { type: "image/jpeg" })), (e) => e.status === 413);
});

test("the posts route rejects more than 4 photos", async () => {
  const form = new FormData();
  for (const [k, v] of Object.entries({ type: "text", townId: "amherst", body: "Five photos", author: "Test" })) form.append(k, v);
  const img = await jpegWithGps();
  for (let i = 0; i < 5; i++) form.append("photos", new Blob([img], { type: "image/jpeg" }), `p${i}.jpg`);
  const res = await POST(new Request("http://test/api/forum/posts", { method: "POST", body: form }));
  assert.equal(res.status, 400);
  assert.match((await res.json()).error, /up to 4/);
});

test("createScanPost(SAMPLE_SCAN) puts a scan post on top with town + county, and drops lat/lng", async () => {
  const post = await createScanPost(SAMPLE_SCAN);

  assert.equal(post.type, "scan");
  assert.equal(post.townName, "Amherst");
  assert.equal(post.county, "Hampshire");
  assert.deepEqual(post.scan, { species: "deer-tick", confidence: 0.82, stage: "adult", scannedAt: SAMPLE_SCAN.scannedAt });
  assert.equal((await getForumStore().listPosts())[0].id, post.id, "newest post is first in the feed");

  // lat/lng never left the browser, and nothing stored carries them (or any coordinates).
  assert.ok(![...sent.keys()].some((k) => /lat|lng/i.test(k)), "form has no lat/lng fields");
  const stored = JSON.stringify(globalThis.__forumDb.posts.find((p) => p.id === post.id));
  assert.doesNotMatch(stored, /lat|lng|42\.37|72\.51/);
  assert.ok(globalThis.__forumDb.posts.every((p) => !("lat" in p) && !("lng" in p)), "legacy posts were migrated without coordinates");

  // The fixture photo has GPS EXIF; the stored copy has none.
  assert.ok(hasGps((await sharp(readFileSync("public/samples/scan-tick.jpg")).metadata()).exif));
  const image = await getForumStore().getPhoto(post.photos[0].split("/").pop());
  assert.equal((await sharp(image.bytes).metadata()).exif, undefined);
});

test("createScanPost rejects a town outside Massachusetts", async () => {
  await assert.rejects(createScanPost({ ...SAMPLE_SCAN, location: { town: "Hartford", lat: 41.76, lng: -72.68 } }), /Location is outside Massachusetts/);
});

test("existing posts load as text posts, without coordinates", async () => {
  const legacy = await getForumStore().getPost("legacy-1");
  assert.equal(legacy.type, "text");
  assert.equal(legacy.townName, "Amherst");
  assert.equal(legacy.county, "Hampshire");
  assert.deepEqual(legacy.photos, ["/api/forum/photos/old"]);
  assert.equal("lat" in legacy || "lng" in legacy, false);
  assert.equal((await getForumStore().getPhoto("old")).type, "image/jpeg");
});
