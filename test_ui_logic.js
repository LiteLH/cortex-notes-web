
// Minimal Unit Test for UI Logic
// Run with: node test_ui_logic.js

import { format, isToday, isYesterday, isThisWeek, parseISO, subDays } from 'date-fns';
import Fuse from 'fuse.js';

console.log("🧪 Starting UI Logic Tests...");

// Mock Data
const now = new Date();
const mockNotes = [
    { id: '1', title: 'Today Note', created_at: now.toISOString(), tags: ['work'] },
    { id: '2', title: 'Yesterday Note', created_at: subDays(now, 1).toISOString(), tags: ['report'] },
    { id: '3', title: 'Old Note', created_at: subDays(now, 10).toISOString(), tags: ['archive'] },
];

// --- Test 1: Timeline Grouping ---
console.log("\n[Test 1] Timeline Grouping");
const groups = { Today: [], Yesterday: [], ThisWeek: [], Older: [] };

mockNotes.forEach(note => {
    const date = parseISO(note.created_at);
    if (isToday(date)) groups.Today.push(note);
    else if (isYesterday(date)) groups.Yesterday.push(note);
    else if (isThisWeek(date)) groups.ThisWeek.push(note);
    else groups.Older.push(note);
});

if (groups.Today.length === 1 && groups.Today[0].title === 'Today Note') console.log("✅ Today: PASS");
else console.error("❌ Today: FAIL");

if (groups.Yesterday.length === 1 && groups.Yesterday[0].title === 'Yesterday Note') console.log("✅ Yesterday: PASS");
else console.error("❌ Yesterday: FAIL");

if (groups.Older.length === 1 && groups.Older[0].title === 'Old Note') console.log("✅ Older: PASS");
else console.error("❌ Older: FAIL");


// --- Test 2: Fuse Search ---
console.log("\n[Test 2] Fuse.js Search");
const fuse = new Fuse(mockNotes, { keys: ['title', 'tags'], threshold: 0.3 });

const res1 = fuse.search('Today');
if (res1.length > 0 && res1[0].item.title === 'Today Note') console.log("✅ Search Title: PASS");
else console.error("❌ Search Title: FAIL");

const res2 = fuse.search('report');
if (res2.length > 0 && res2[0].item.id === '2') console.log("✅ Search Tag: PASS");
else console.error("❌ Search Tag: FAIL");


// --- Test 3: Tag Extraction ---
console.log("\n[Test 3] Tag Extraction");
const counts = {};
mockNotes.forEach(n => n.tags?.forEach(t => counts[t] = (counts[t] || 0) + 1));
const sortedTags = Object.entries(counts).sort((a,b) => b[1] - a[1]);

if (sortedTags.length === 3) console.log("✅ Tag Count: PASS");
else console.error("❌ Tag Count: FAIL");

console.log("\n🏁 Tests Complete.");
