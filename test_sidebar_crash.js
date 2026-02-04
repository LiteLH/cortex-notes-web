
try {
    const safeNotes = [
        { id: 1, tags: ["a", "b"] },
        { id: 2, tags: "not-an-array" }, // This should crash
        { id: 3, tags: null }
    ];
    
    const counts = {};
    safeNotes.forEach(n => {
        console.log("Processing note:", n.id);
        n.tags?.forEach(t => counts[t] = (counts[t] || 0) + 1);
    });
    console.log("Success");
} catch (e) {
    console.error("Caught error:", e.message);
}
