
try {
    const d = new Date(undefined);
    console.log("Date(undefined):", d);
    console.log("toLocaleString:", d.toLocaleString());
} catch (e) {
    console.error("Caught expected error:", e.message);
}

try {
    const d = new Date(null); // This is actually 1970-01-01
    console.log("Date(null):", d);
    console.log("toLocaleString:", d.toLocaleString());
} catch (e) {
    console.error("Caught error with null:", e.message);
}

try {
    const d = new Date("invalid-date-string");
    console.log("Date('invalid'):", d);
    console.log("toLocaleString:", d.toLocaleString());
} catch (e) {
    console.error("Caught expected error with invalid string:", e.message);
}
