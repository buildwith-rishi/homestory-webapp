
function getTaskDate(startDate, dayNum, includeSundays) {
    // Current Logic simulation (assuming local=IST)
    // We can't easily simulate local timezone of user in node, but we can see what happens with UTC.
    
    // New Logic: UTC based
    const [y, m, d] = startDate.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d)); 

    if (includeSundays) {
      date.setUTCDate(date.getUTCDate() + (dayNum - 1));
      return date.toISOString();
    }

    let validDaysCount = 1;
    while (validDaysCount < dayNum) {
      date.setUTCDate(date.getUTCDate() + 1);
      if (date.getUTCDay() !== 0) {
        validDaysCount += 1;
      }
    }

    return date.toISOString();
}

console.log("Start: 2026-03-21 (Saturday)");
console.log("Day 1 (Sat):", getTaskDate("2026-03-21", 1, false));
console.log("Day 2 (Mon?):", getTaskDate("2026-03-21", 2, false));
console.log("Day 3 (Tue):", getTaskDate("2026-03-21", 3, false));

console.log("Start: 2026-03-22 (Sunday)");
// If start date is Sunday and we exclude sundays?
// Original logic would return Sunday for Day 1.
console.log("Day 1 (Sun):", getTaskDate("2026-03-22", 1, false)); 
