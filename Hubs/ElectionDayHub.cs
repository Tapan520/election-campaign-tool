using Microsoft.AspNetCore.SignalR;

namespace Nirvachak_AI.Hubs;

public class ElectionDayHub : Hub
{
    public async Task JoinConstituency(string constituencyId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"c-{constituencyId}");
    }

    public async Task LeaveConstituency(string constituencyId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"c-{constituencyId}");
    }

    public static async Task BroadcastTurnoutUpdate(IHubContext<ElectionDayHub> hub,
        int constituencyId, int boothNumber, int votedCount, int totalVoters)
    {
        await hub.Clients.Group($"c-{constituencyId}").SendAsync("TurnoutUpdated", new
        {
            boothNumber,
            votedCount,
            totalVoters,
            percent = totalVoters > 0 ? Math.Round((double)votedCount / totalVoters * 100, 1) : 0
        });
    }
}
