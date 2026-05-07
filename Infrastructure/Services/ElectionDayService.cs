using Microsoft.EntityFrameworkCore;
using ElectionCampaignTool.Domain.Enums;
using ElectionCampaignTool.Infrastructure.Data;

namespace ElectionCampaignTool.Infrastructure.Services;

public class BoothTurnoutDto
{
    public int BoothNumber { get; set; }
    public string BoothName { get; set; } = string.Empty;
    public int TotalVoters { get; set; }
    public int VotedCount { get; set; }
    public double TurnoutPercent => TotalVoters > 0 ? Math.Round((double)VotedCount / TotalVoters * 100, 1) : 0;
}

public class ElectionDayService
{
    private readonly AppDbContext _db;
    public ElectionDayService(AppDbContext db) => _db = db;

    public async Task<bool> MarkVotedAsync(int voterId)
    {
        var voter = await _db.Voters.FindAsync(voterId);
        if (voter == null) return false;
        voter.ElectionDayStatus = ElectionDayStatus.Voted;
        voter.LastContactedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        var booth = await _db.Booths.FirstOrDefaultAsync(b =>
            b.BoothNumber == voter.BoothNumber && b.ConstituencyId == voter.ConstituencyId);
        if (booth != null)
        {
            booth.VotedCount = await _db.Voters.CountAsync(v =>
                v.BoothNumber == voter.BoothNumber &&
                v.ConstituencyId == voter.ConstituencyId &&
                v.ElectionDayStatus == ElectionDayStatus.Voted);
            booth.LastUpdated = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }
        return true;
    }

    public async Task<bool> MarkAbsentAsync(int voterId)
    {
        var voter = await _db.Voters.FindAsync(voterId);
        if (voter == null) return false;
        voter.ElectionDayStatus = ElectionDayStatus.Absent;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<List<BoothTurnoutDto>> GetLiveTurnoutAsync(int constituencyId)
    {
        return await _db.Booths
            .Where(b => b.ConstituencyId == constituencyId)
            .OrderBy(b => b.BoothNumber)
            .Select(b => new BoothTurnoutDto
            {
                BoothNumber = b.BoothNumber,
                BoothName = b.BoothName,
                TotalVoters = b.TotalVoters,
                VotedCount = b.VotedCount
            })
            .ToListAsync();
    }

    public async Task<(int total, int voted, double percent)> GetConstituencyTurnoutAsync(int constituencyId)
    {
        var total = await _db.Voters.CountAsync(v => v.ConstituencyId == constituencyId && !v.IsDeleted);
        var voted = await _db.Voters.CountAsync(v => v.ConstituencyId == constituencyId && !v.IsDeleted && v.ElectionDayStatus == ElectionDayStatus.Voted);
        var percent = total > 0 ? Math.Round((double)voted / total * 100, 1) : 0;
        return (total, voted, percent);
    }
}
