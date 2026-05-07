"use strict";

// SignalR - Election Day Live Tracking
const connection = new signalR.HubConnectionBuilder()
    .withUrl("/hubs/electionday")
    .withAutomaticReconnect()
    .build();

connection.on("TurnoutUpdated", function (data) {
    // Update booth row
    const row = document.querySelector(`[data-booth="${data.boothNumber}"]`);
    if (row) {
        row.querySelector('.voted-count').textContent = data.votedCount;
        row.querySelector('.turnout-pct').textContent = data.percent + '%';
        const fill = row.querySelector('.turnout-bar-fill');
        if (fill) fill.style.width = data.percent + '%';
    }
    // Update overall stats
    updateOverallStats();
});

async function updateOverallStats() {
    const response = await fetch(`/api/ElectionDayStats?constituencyId=${window._constituencyId}`);
    if (response.ok) {
        const stats = await response.json();
        const el = document.getElementById('overall-turnout');
        if (el) el.textContent = stats.percent + '%';
        const voted = document.getElementById('overall-voted');
        if (voted) voted.textContent = stats.voted;
    }
}

connection.start().then(function () {
    if (window._constituencyId) {
        connection.invoke("JoinConstituency", window._constituencyId.toString());
    }
}).catch(err => console.error("SignalR error:", err));
