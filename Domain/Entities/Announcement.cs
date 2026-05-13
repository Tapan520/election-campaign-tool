using Nirvachak_AI.Domain.Enums;

namespace Nirvachak_AI.Domain.Entities;

public class Announcement
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public AnnouncementCategory Category { get; set; }
    public string CreatedByUserId { get; set; } = string.Empty;
    public string CreatedByName { get; set; } = string.Empty;
    public int? ConstituencyId { get; set; }
    public Constituency? Constituency { get; set; }

    // "All" or comma-separated UserRole names e.g. "FieldWorker,BoothAgent"
    public string TargetRoles { get; set; } = "All";

    public DateTime? ExpiresAt { get; set; }
    public bool RequiresAcknowledgement { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsPinned { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<AnnouncementAcknowledgement> Acknowledgements { get; set; } = new List<AnnouncementAcknowledgement>();

    public bool TargetsRole(UserRole role)
    {
        if (TargetRoles == "All") return true;
        return TargetRoles.Split(',').Any(r => r.Trim() == role.ToString());
    }

    public string CategoryIcon => Category switch
    {
        AnnouncementCategory.CriticalAlert       => "bi-exclamation-triangle-fill",
        AnnouncementCategory.ECComplianceNotice  => "bi-shield-check",
        AnnouncementCategory.DailyBriefing       => "bi-clipboard2-check-fill",
        AnnouncementCategory.Motivation          => "bi-trophy-fill",
        AnnouncementCategory.LiveDataNudge       => "bi-graph-up-arrow",
        _                                        => "bi-megaphone-fill"
    };

    public string CategoryColor => Category switch
    {
        AnnouncementCategory.CriticalAlert       => "danger",
        AnnouncementCategory.ECComplianceNotice  => "warning",
        AnnouncementCategory.DailyBriefing       => "info",
        AnnouncementCategory.Motivation          => "success",
        AnnouncementCategory.LiveDataNudge       => "primary",
        _                                        => "secondary"
    };

    public string CategoryLabel => Category switch
    {
        AnnouncementCategory.CampaignAnnouncement => "Campaign",
        AnnouncementCategory.CriticalAlert        => "Critical Alert",
        AnnouncementCategory.ECComplianceNotice   => "EC Compliance",
        AnnouncementCategory.DailyBriefing        => "Daily Briefing",
        AnnouncementCategory.Motivation           => "Motivation",
        AnnouncementCategory.LiveDataNudge        => "Live Nudge",
        _                                         => Category.ToString()
    };
}
