namespace Nirvachak_AI.Domain.Entities;

public class Booth
{
    public int Id { get; set; }
    public int BoothNumber { get; set; }
    public string BoothName { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string? WardNumber { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public int TotalVoters { get; set; }
    public int MaleVoters { get; set; }
    public int FemaleVoters { get; set; }
    public int OtherVoters { get; set; }
    public string? AssignedAgentName { get; set; }
    public string? AssignedAgentPhone { get; set; }
    public string? AssignedWorkerUserId { get; set; }
    public int ConstituencyId { get; set; }
    public Constituency? Constituency { get; set; }
    public int VotedCount { get; set; } = 0;
    public DateTime? LastUpdated { get; set; }
}
