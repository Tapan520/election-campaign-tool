using ElectionCampaignTool.Domain.Enums;

namespace ElectionCampaignTool.Domain.Entities;

public class Volunteer
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string? AssignedArea { get; set; }
    public string? AssignedBoothNumbers { get; set; }
    public VolunteerTask Task { get; set; }
    public int ConstituencyId { get; set; }
    public Constituency? Constituency { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime RegisteredAt { get; set; } = DateTime.UtcNow;
    public string? Notes { get; set; }
}
