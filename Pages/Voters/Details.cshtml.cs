using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;
using ElectionCampaignTool.Domain.Entities;
using ElectionCampaignTool.Domain.Enums;
using ElectionCampaignTool.Infrastructure.Data;

namespace ElectionCampaignTool.Pages.Voters;

public class DetailsModel : PageModel
{
    private readonly AppDbContext _db;
    private readonly UserManager<AppUser> _userManager;

    public DetailsModel(AppDbContext db, UserManager<AppUser> userManager)
    {
        _db = db;
        _userManager = userManager;
    }

    public Voter? Voter { get; set; }
    public List<DoorToDoorVisit> Visits { get; set; } = new();

    public async Task OnGetAsync(int id)
    {
        Voter = await _db.Voters.FindAsync(id);
        Visits = await _db.DoorToDoorVisits
            .Where(v => v.VoterId == id)
            .OrderByDescending(v => v.VisitedAt)
            .ToListAsync();
    }

    private bool IsRestrictedRole(AppUser? user)
        => user?.Role == UserRole.FieldWorker || user?.Role == UserRole.BoothAgent;

    public async Task<IActionResult> OnPostUpdateSentimentAsync(int id, VoterSentiment sentiment)
    {
        var currentUser = await _userManager.GetUserAsync(User);
        if (IsRestrictedRole(currentUser)) return Forbid();
        var voter = await _db.Voters.FindAsync(id);
        if (voter != null)
        {
            voter.Sentiment = sentiment;
            await _db.SaveChangesAsync();
            TempData["Message"] = "Sentiment updated successfully.";
        }
        return RedirectToPage(new { id });
    }

    public async Task<IActionResult> OnPostLogVisitAsync(int id, VisitStatus visitStatus, VoterSentiment sentiment, string? notes)
    {
        var user = await _userManager.GetUserAsync(User);
        var voter = await _db.Voters.FindAsync(id);
        if (voter != null && user != null)
        {
            var visit = new DoorToDoorVisit
            {
                VoterId = id,
                WorkerUserId = user.Id,
                WorkerName = user.FullName,
                VisitedAt = DateTime.UtcNow,
                Status = visitStatus,
                SentimentAfterVisit = sentiment,
                Notes = notes
            };
            _db.DoorToDoorVisits.Add(visit);
            voter.Sentiment = sentiment;
            voter.LastContactedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            TempData["Message"] = "Visit logged successfully.";
        }
        return RedirectToPage(new { id });
    }
}
