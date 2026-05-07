namespace ElectionCampaignTool.Domain.Entities;

public class SurveyResponse
{
    public int Id { get; set; }
    public int SurveyId { get; set; }
    public Survey? Survey { get; set; }
    public string? RespondentName { get; set; }
    public string? RespondentPhone { get; set; }
    public string? Ward { get; set; }
    public int? BoothNumber { get; set; }
    public int Rating { get; set; } // 1 = Very Negative ... 5 = Very Positive
    public string? Feedback { get; set; }
    public DateTime RespondedAt { get; set; } = DateTime.UtcNow;
}
