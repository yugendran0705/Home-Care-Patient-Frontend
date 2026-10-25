// Lets TypeScript accept `import logo from "./logo.png"`. Metro resolves the
// import to an asset id, which <Image source={...}> takes as-is.
declare module "*.png" {
  const asset: number;
  export default asset;
}

declare module "*.jpg" {
  const asset: number;
  export default asset;
}
