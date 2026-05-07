using ElectionCampaignTool.Domain.Enums;

namespace ElectionCampaignTool.Domain.Entities;

public class Survey
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public SurveyCategory Category { get; set; }
    public int ConstituencyId { get; set; }
    public Constituency? Constituency { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<SurveyResponse> Responses { get; set; } = new List<SurveyResponse>();
}
