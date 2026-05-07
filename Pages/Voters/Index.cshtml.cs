using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;
using ElectionCampaignTool.Domain.Entities;
using ElectionCampaignTool.Domain.Enums;
using ElectionCampaignTool.Infrastructure.Data;

namespace ElectionCampaignTool.Pages.Voters;

public class IndexModel : PageModel
{
    private readonly AppDbContext _db;
    private readonly UserManager<AppUser> _userManager;
    private const int PageSize = 50;

    public IndexModel(AppDbContext db, UserManager<AppUser> userManager)
    {
        _db = db;
        _userManager = userManager;
    }

    public List<Voter> Voters { get; set; } = new();
    public List<int> BoothNumbers { get; set; } = new();
    public List<Constituency> Constituencies { get; set; } = new();
    public bool IsAdmin { get; set; }
    public bool CanImportCsv { get; set; }
    public int TotalCount { get; set; }
    public int TotalPages { get; set; }

    [Microsoft.AspNetCore.Mvc.BindProperty(SupportsGet = true)]
    public string? Search { get; set; }
    [Microsoft.AspNetCore.Mvc.BindProperty(SupportsGet = true)]
    public int? ConstituencyFilter { get; set; }
    [Microsoft.AspNetCore.Mvc.BindProperty(SupportsGet = true)]
    public int? BoothFilter { get; set; }
    [Microsoft.AspNetCore.Mvc.BindProperty(SupportsGet = true)]
    public string? SentimentFilter { get; set; }
    [Microsoft.AspNetCore.Mvc.BindProperty(SupportsGet = true)]
    public string? GenderFilter { get; set; }
    [Microsoft.AspNetCore.Mvc.BindProperty(SupportsGet = true)]
    public int CurrentPage { get; set; } = 1;

    public async Task OnGetAsync()
    {
        var user = await _userManager.GetUserAsync(User);
        IsAdmin = user?.Role == UserRole.Admin;
        CanImportCsv = user?.Role != UserRole.FieldWorker && user?.Role != UserRole.BoothAgent;

        if (IsAdmin)
            Constituencies = await _db.Constituencies.OrderBy(c => c.Name).ToListAsync();

        IQueryable<Voter> query = _db.Voters.Where(v => !v.IsDeleted);

        if (IsAdmin)
        {
            if (ConstituencyFilter.HasValue)
                query = query.Where(v => v.ConstituencyId == ConstituencyFilter);
        }
        else if (user?.ConstituencyId.HasValue == true)
            query = query.Where(v => v.ConstituencyId == user.ConstituencyId);

        if (!string.IsNullOrWhiteSpace(Search))
            query = query.Where(v => v.Name.Contains(Search) || v.VoterId.Contains(Search) ||
                (v.MobileNumber != null && v.MobileNumber.Contains(Search)));

        if (BoothFilter.HasValue)
            query = query.Where(v => v.BoothNumber == BoothFilter);

        if (!string.IsNullOrEmpty(SentimentFilter) && Enum.TryParse<VoterSentiment>(SentimentFilter, out var sentiment))
            query = query.Where(v => v.Sentiment == sentiment);

        if (!string.IsNullOrEmpty(GenderFilter))
            query = query.Where(v => v.Gender == GenderFilter);

        TotalCount = await query.CountAsync();
        TotalPages = (int)Math.Ceiling((double)TotalCount / PageSize);
        CurrentPage = Math.Max(1, Math.Min(CurrentPage, Math.Max(1, TotalPages)));

        Voters = await query
            .OrderBy(v => v.BoothNumber).ThenBy(v => v.SerialNumber)
            .Skip((CurrentPage - 1) * PageSize)
            .Take(PageSize)
            .ToListAsync();

        // Booth numbers for filter dropdown — scoped to selected constituency for Admin
        IQueryable<Voter> allVoters = _db.Voters.Where(v => !v.IsDeleted);
        if (IsAdmin)
        {
            if (ConstituencyFilter.HasValue)
                allVoters = allVoters.Where(v => v.ConstituencyId == ConstituencyFilter);
        }
        else if (user?.ConstituencyId.HasValue == true)
            allVoters = allVoters.Where(v => v.ConstituencyId == user.ConstituencyId);
        BoothNumbers = await allVoters.Select(v => v.BoothNumber).Distinct().OrderBy(n => n).ToListAsync();
    }
}
