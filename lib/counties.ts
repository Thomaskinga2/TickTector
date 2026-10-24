// Mass. DPH reports Dukes and Nantucket counties as one group; everything else is one county per group.
export function dphCounty(county: string) {
  return county === "Dukes" || county === "Nantucket" ? "Dukes & Nantucket" : county;
}

// "Hampshire" -> "Hampshire County"; the island group keeps its own name.
export function countyLabel(county: string) {
  return county.includes("&") ? county : `${county} County`;
}
