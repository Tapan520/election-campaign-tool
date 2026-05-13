using Nirvachak_AI.Domain.Enums;

namespace Nirvachak_AI.Domain.Entities;

public class CampaignEvent
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public CampaignEventType EventType { get; set; }
    public string? Description { get; set; }
    public string Location { get; set; } = string.Empty;
    public DateTime ScheduledAt { get; set; }
    public int? ExpectedAttendance { get; set; }
    public int? ActualAttendance { get; set; }
    public string? TargetBoothNumbers { get; set; }
    public string? TargetWards { get; set; }
    public string? OrganizedByUserId { get; set; }
    public string? OrganizedByName { get; set; }
    public int ConstituencyId { get; set; }
    public Constituency? Constituency { get; set; }
    public bool IsCompleted { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
