const cache = new Map();

cache.set("/products/1", "mascara");
cache.set("/products/2", "eyeshadow");

console.log(cache.has("/products/1")); // true
console.log(cache.get("/products/1")); // mascara
console.log(cache.has("/products/99")); // false
console.log(cache.get("products/99")); // undefined

console.log(cache.size); // 2