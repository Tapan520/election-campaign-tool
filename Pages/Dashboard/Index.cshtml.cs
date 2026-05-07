using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;
using ElectionCampaignTool.Domain.Entities;
using ElectionCampaignTool.Domain.Enums;
using ElectionCampaignTool.Infrastructure.Data;

namespace ElectionCampaignTool.Pages.Dashboard;

public class IndexModel : PageModel
{
    private readonly AppDbContext _db;
    private readonly UserManager<AppUser> _userManager;

    public IndexModel(AppDbContext db, UserManager<AppUser> userManager)
    {
        _db = db;
        _userManager = userManager;
    }

    // ?? Drill-down filters ??????????????????????????????????????????????????
    [BindProperty(SupportsGet = true)]
    public int? SelectedConstituencyId { get; set; }

    [BindProperty(SupportsGet = true)]
    public string? SelectedWard { get; set; }

    [BindProperty(SupportsGet = true)]
    public int? SelectedBoothNumber { get; set; }

    // ?? Dropdown sources ????????????????????????????????????????????????????
    public bool IsAdmin { get; set; }
    public List<Constituency> Constituencies { get; set; } = new();
    public List<Ward> Wards { get; set; } = new();
    public List<Booth> BoothOptions { get; set; } = new();
    public string? ActiveConstituencyName { get; set; }

    // ?? Stats ???????????????????????????????????????????????????????????????
    public int TotalVoters { get; set; }
    public int FavourVoters { get; set; }
    public int TotalBooths { get; set; }
    public int OpenGrievances { get; set; }
    public int TotalVolunteers { get; set; }
    public int ActiveVolunteers { get; set; }
    public decimal TotalExpenses { get; set; }
    public int ECCompliantExpenses { get; set; }
    public Dictionary<string, int> SentimentBreakdown { get; set; } = new();
    public List<Booth> BoothSummary { get; set; } = new();
    public List<CampaignEvent> UpcomingEvents { get; set; } = new();

    public async Task OnGetAsync()
    {
        var user = await _userManager.GetUserAsync(User);
        IsAdmin = user?.Role == UserRole.Admin;

        // Resolve the effective constituency
        int? cId = IsAdmin ? SelectedConstituencyId : user?.ConstituencyId;

        // Populate constituency dropdown for Admin
        if (IsAdmin)
            Constituencies = await _db.Constituencies.OrderBy(c => c.Name).ToListAsync();

        if (cId.HasValue)
            ActiveConstituencyName = (await _db.Constituencies.FindAsync(cId.Value))?.Name;

        // Populate ward dropdown once constituency is known
        if (cId.HasValue)
            Wards = await _db.Wards
                .Where(w => w.ConstituencyId == cId.Value)
                .OrderBy(w => w.WardNumber)
                .ToListAsync();

        // Populate booth dropdown filtered by ward when selected
        if (cId.HasValue)
        {
            var boothQ = _db.Booths.Where(b => b.ConstituencyId == cId.Value);
            if (!string.IsNullOrEmpty(SelectedWard))
                boothQ = boothQ.Where(b => b.WardNumber == SelectedWard);
            BoothOptions = await boothQ.OrderBy(b => b.BoothNumber).ToListAsync();
        }

        // ?? Base queries ????????????????????????????????????????????????????
        IQueryable<Voter> voters = _db.Voters.Where(v => !v.IsDeleted);
        IQueryable<Booth> booths = _db.Booths;
        IQueryable<Grievance> grievances = _db.Grievances;
        IQueryable<Volunteer> volunteers = _db.Volunteers;
        IQueryable<Expense> expenses = _db.Expenses;
        IQueryable<CampaignEvent> events = _db.CampaignEvents;

        // ?? Constituency filter ?????????????????????????????????????????????
        if (cId.HasValue)
        {
            voters      = voters.Where(v => v.ConstituencyId == cId);
            booths      = booths.Where(b => b.ConstituencyId == cId);
            grievances  = grievances.Where(g => g.ConstituencyId == cId);
            volunteers  = volunteers.Where(v => v.ConstituencyId == cId);
            expenses    = expenses.Where(e => e.ConstituencyId == cId);
            events      = events.Where(e => e.ConstituencyId == cId);
        }

        // ?? Ward filter ?????????????????????????????????????????????????????
        if (!string.IsNullOrEmpty(SelectedWard))
        {
            voters     = voters.Where(v => v.WardNumber == SelectedWard);
            booths     = booths.Where(b => b.WardNumber == SelectedWard);
            grievances = grievances.Where(g => g.Ward == SelectedWard);
        }

        // ?? Booth filter ????????????????????????????????????????????????????
        if (SelectedBoothNumber.HasValue)
        {
            voters     = voters.Where(v => v.BoothNumber == SelectedBoothNumber.Value);
            booths     = booths.Where(b => b.BoothNumber == SelectedBoothNumber.Value);
            grievances = grievances.Where(g => g.BoothNumber == SelectedBoothNumber.Value);
        }

        // ?? Aggregate stats ?????????????????????????????????????????????????
        TotalVoters        = await voters.CountAsync();
        FavourVoters       = await voters.CountAsync(v => v.Sentiment == VoterSentiment.Favour);
        TotalBooths        = await booths.CountAsync();
        OpenGrievances     = await grievances.CountAsync(g => g.Status == GrievanceStatus.Open);
        TotalVolunteers    = await volunteers.CountAsync();
        ActiveVolunteers   = await volunteers.CountAsync(v => v.IsActive);
        TotalExpenses      = (decimal)(await expenses.SumAsync(e => (double?)e.Amount) ?? 0);
        ECCompliantExpenses = await expenses.CountAsync(e => e.IsECCompliant);

        BoothSummary = await booths.OrderBy(b => b.BoothNumber).Take(8).ToListAsync();

        UpcomingEvents = await events
            .Where(e => e.ScheduledAt >= DateTime.Now && !e.IsCompleted)
            .OrderBy(e => e.ScheduledAt)
            .Take(5).ToListAsync();

        var sentimentCounts = await voters
            .GroupBy(v => v.Sentiment)
            .Select(g => new { Sentiment = g.Key, Count = g.Count() })
            .ToListAsync();

        foreach (VoterSentiment s in Enum.GetValues<VoterSentiment>())
        {
            var found = sentimentCounts.FirstOrDefault(x => x.Sentiment == s);
            SentimentBreakdown[s.ToString()] = found?.Count ?? 0;
        }
    }
}
