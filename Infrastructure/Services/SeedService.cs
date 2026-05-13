using Microsoft.AspNetCore.Identity;
using Nirvachak_AI.Domain.Entities;
using Nirvachak_AI.Domain.Enums;
using Nirvachak_AI.Infrastructure.Data;

namespace Nirvachak_AI.Infrastructure.Services;

public static class SeedService
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();

        await db.Database.EnsureCreatedAsync();

        foreach (var role in Enum.GetNames<UserRole>())
        {
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole(role));
        }

        if (!db.Constituencies.Any())
        {
            var constituency = new Constituency
            {
                Name = "Pune Cantonment",
                Code = "AC-168",
                ElectionType = ElectionType.MLA,
                State = "Maharashtra",
                District = "Pune",
                CandidateName = "Demo Candidate",
                PartyName = "Demo Party",
                ElectionDate = new DateTime(2025, 11, 15)
            };
            db.Constituencies.Add(constituency);
            await db.SaveChangesAsync();

            for (int i = 1; i <= 8; i++)
            {
                db.Booths.Add(new Booth
                {
                    BoothNumber = i,
                    BoothName = $"Booth {i} - Primary School Ward {i}",
                    Address = $"Ward {i}, Pune Cantonment",
                    WardNumber = i.ToString(),
                    ConstituencyId = constituency.Id,
                    TotalVoters = 400 + (i * 15)
                });
                db.Wards.Add(new Ward
                {
                    WardNumber = i.ToString(),
                    WardName = $"Ward {i} - {new[] { "Gandhi Nagar", "Nehru Vihar", "Shivaji Park", "Ambedkar Colony", "Tilak Nagar", "Subhash Chowk", "Patel Wadi", "Laxmi Nagar" }[i - 1]}",
                    Description = $"Ward {i} of Pune Cantonment constituency",
                    ConstituencyId = constituency.Id
                });
            }
            await db.SaveChangesAsync();

            // Seed sample voters for demo
            var rnd = new Random(42);
            var names = new[] { "Rajesh Kumar", "Sunita Sharma", "Amit Patel", "Priya Singh", "Vijay Rao",
                "Meena Joshi", "Sanjay Gupta", "Kavitha Nair", "Dinesh Patil", "Anita More" };
            var voters = new List<Voter>();
            for (int b = 1; b <= 4; b++)
            {
                for (int s = 1; s <= 30; s++)
                {
                    voters.Add(new Voter
                    {
                        VoterId = $"MH{b:D2}{s:D4}",
                        Name = names[rnd.Next(names.Length)] + $" {s}",
                        Age = 20 + rnd.Next(55),
                        Gender = rnd.Next(2) == 0 ? "M" : "F",
                        Address = $"House {s}, Ward {b}, Pune",
                        BoothNumber = b,
                        WardNumber = b.ToString(),
                        PannaNumber = ((s - 1) / 10 + 1).ToString(),
                        SerialNumber = s,
                        ConstituencyId = constituency.Id,
                        Sentiment = (VoterSentiment)rnd.Next(5)
                    });
                }
            }
            await db.Voters.AddRangeAsync(voters);
            await db.SaveChangesAsync();
        }

        if (!userManager.Users.Any())
        {
            var constituency = db.Constituencies.First();

            var admin = new AppUser
            {
                UserName = "admin@election.com",
                Email = "admin@election.com",
                FullName = "System Administrator",
                Role = UserRole.Admin,
                ConstituencyId = constituency.Id,
                EmailConfirmed = true,
                IsActive = true
            };
            var r = await userManager.CreateAsync(admin, "Admin@123");
            if (r.Succeeded) await userManager.AddToRoleAsync(admin, nameof(UserRole.Admin));

            var manager = new AppUser
            {
                UserName = "manager@election.com",
                Email = "manager@election.com",
                FullName = "Campaign Manager",
                Role = UserRole.CampaignManager,
                ConstituencyId = constituency.Id,
                EmailConfirmed = true,
                IsActive = true
            };
            var r2 = await userManager.CreateAsync(manager, "Manager@123");
            if (r2.Succeeded) await userManager.AddToRoleAsync(manager, nameof(UserRole.CampaignManager));

            var worker = new AppUser
            {
                UserName = "worker@election.com",
                Email = "worker@election.com",
                FullName = "Field Worker 1",
                Role = UserRole.FieldWorker,
                ConstituencyId = constituency.Id,
                AssignedBoothNumbers = "1,2",
                EmailConfirmed = true,
                IsActive = true
            };
            var r3 = await userManager.CreateAsync(worker, "Worker@123");
            if (r3.Succeeded) await userManager.AddToRoleAsync(worker, nameof(UserRole.FieldWorker));
        }

        // ?? Campaign Events ??????????????????????????????????????????????????
        if (!db.CampaignEvents.Any())
        {
            var constituency = db.Constituencies.First();
            var now = DateTime.Now;
            db.CampaignEvents.AddRange(
                new CampaignEvent { Title = "Gandhi Nagar Padyatra", EventType = CampaignEventType.DoorToDoor, Description = "Door-to-door campaign covering all lanes of Gandhi Nagar ward.", Location = "Gandhi Nagar, Ward 1", ScheduledAt = now.AddDays(-20), ActualAttendance = 38, ExpectedAttendance = 40, TargetWards = "1", IsCompleted = true, OrganizedByName = "Campaign Manager", ConstituencyId = constituency.Id },
                new CampaignEvent { Title = "Nehru Vihar Public Rally", EventType = CampaignEventType.Rally, Description = "Large public rally addressing infrastructure & water supply issues.", Location = "Nehru Vihar Ground, Ward 2", ScheduledAt = now.AddDays(-15), ActualAttendance = 520, ExpectedAttendance = 500, TargetWards = "2", IsCompleted = true, OrganizedByName = "Campaign Manager", ConstituencyId = constituency.Id },
                new CampaignEvent { Title = "Youth Connect � Shivaji Park", EventType = CampaignEventType.SmallMeeting, Description = "Interactive session with first-time voters and youth leaders.", Location = "Shivaji Park Community Hall, Ward 3", ScheduledAt = now.AddDays(-12), ActualAttendance = 65, ExpectedAttendance = 75, TargetWards = "3", IsCompleted = true, OrganizedByName = "Campaign Manager", ConstituencyId = constituency.Id },
                new CampaignEvent { Title = "Senior Citizens Samvad", EventType = CampaignEventType.SmallMeeting, Description = "Grievance-listening session for senior citizens.", Location = "Ambedkar Colony Chowk, Ward 4", ScheduledAt = now.AddDays(-10), ActualAttendance = 42, ExpectedAttendance = 50, TargetWards = "4", IsCompleted = true, OrganizedByName = "Field Worker 1", ConstituencyId = constituency.Id },
                new CampaignEvent { Title = "Phone Banking Drive � Booths 1-3", EventType = CampaignEventType.PhoneCall, Description = "Volunteer phone-calling drive targeting undecided voters.", Location = "Campaign Office", ScheduledAt = now.AddDays(-7), ActualAttendance = 12, ExpectedAttendance = 15, TargetBoothNumbers = "1,2,3", IsCompleted = true, OrganizedByName = "Campaign Manager", ConstituencyId = constituency.Id },
                new CampaignEvent { Title = "Tilak Nagar Nukkad Natak", EventType = CampaignEventType.Other, Description = "Street play highlighting candidate's development agenda.", Location = "Tilak Nagar Square, Ward 5", ScheduledAt = now.AddDays(-4), ActualAttendance = 180, ExpectedAttendance = 150, TargetWards = "5", IsCompleted = true, OrganizedByName = "Campaign Manager", ConstituencyId = constituency.Id },
                new CampaignEvent { Title = "Subhash Chowk Door-to-Door", EventType = CampaignEventType.DoorToDoor, Description = "Voter connect initiative covering 200 households.", Location = "Subhash Chowk, Ward 6", ScheduledAt = now.AddDays(2), ExpectedAttendance = 30, TargetWards = "6", IsCompleted = false, OrganizedByName = "Field Worker 1", ConstituencyId = constituency.Id },
                new CampaignEvent { Title = "Patel Wadi Mega Rally", EventType = CampaignEventType.LargeMeeting, Description = "Grand pre-election rally with party leaders.", Location = "Patel Wadi Sports Ground, Ward 7", ScheduledAt = now.AddDays(5), ExpectedAttendance = 1200, TargetWards = "7", IsCompleted = false, OrganizedByName = "Campaign Manager", ConstituencyId = constituency.Id },
                new CampaignEvent { Title = "Women Voters Outreach � Laxmi Nagar", EventType = CampaignEventType.SmallMeeting, Description = "Special session for women voters on safety and empowerment schemes.", Location = "Laxmi Nagar School, Ward 8", ScheduledAt = now.AddDays(8), ExpectedAttendance = 90, TargetWards = "8", IsCompleted = false, OrganizedByName = "Campaign Manager", ConstituencyId = constituency.Id },
                new CampaignEvent { Title = "Constituency-Wide Phone Marathon", EventType = CampaignEventType.PhoneCall, Description = "Final voter reminder calls across all booths.", Location = "Campaign Office", ScheduledAt = now.AddDays(12), ExpectedAttendance = 20, TargetBoothNumbers = "1,2,3,4,5,6,7,8", IsCompleted = false, OrganizedByName = "Campaign Manager", ConstituencyId = constituency.Id }
            );
            await db.SaveChangesAsync();
        }

        // ?? Volunteers ???????????????????????????????????????????????????????
        if (!db.Volunteers.Any())
        {
            var constituency = db.Constituencies.First();
            db.Volunteers.AddRange(
                new Volunteer { Name = "Arjun Deshmukh",   Phone = "9876500001", Email = "arjun.d@mail.com",   Address = "12, Gandhi Nagar, Ward 1",      AssignedArea = "Ward 1",   AssignedBoothNumbers = "1",   Task = VolunteerTask.BoothManagement, IsActive = true,  RegisteredAt = DateTime.UtcNow.AddDays(-30), Notes = "Experienced booth in-charge.",              ConstituencyId = constituency.Id },
                new Volunteer { Name = "Sneha Kulkarni",   Phone = "9876500002", Email = "sneha.k@mail.com",   Address = "45, Nehru Vihar, Ward 2",       AssignedArea = "Ward 2",   AssignedBoothNumbers = "2",   Task = VolunteerTask.VoterOutreach,   IsActive = true,  RegisteredAt = DateTime.UtcNow.AddDays(-28), Notes = "Fluent in Marathi and Hindi.",              ConstituencyId = constituency.Id },
                new Volunteer { Name = "Ravi Shinde",      Phone = "9876500003",                               Address = "88, Shivaji Park, Ward 3",      AssignedArea = "Ward 3",   AssignedBoothNumbers = "3",   Task = VolunteerTask.Transport,       IsActive = true,  RegisteredAt = DateTime.UtcNow.AddDays(-25), Notes = "Owns a 7-seater vehicle.",                  ConstituencyId = constituency.Id },
                new Volunteer { Name = "Pooja Waghmare",   Phone = "9876500004", Email = "pooja.w@mail.com",   Address = "7, Ambedkar Colony, Ward 4",    AssignedArea = "Ward 4",   AssignedBoothNumbers = "4",   Task = VolunteerTask.DataEntry,       IsActive = true,  RegisteredAt = DateTime.UtcNow.AddDays(-22), Notes = "IT graduate, handles voter list updates.",  ConstituencyId = constituency.Id },
                new Volunteer { Name = "Nitin Jadhav",     Phone = "9876500005",                               Address = "33, Tilak Nagar, Ward 5",       AssignedArea = "Ward 5",   AssignedBoothNumbers = "5",   Task = VolunteerTask.BoothManagement, IsActive = true,  RegisteredAt = DateTime.UtcNow.AddDays(-20), Notes = "Party worker for 8 years.",                 ConstituencyId = constituency.Id },
                new Volunteer { Name = "Kavya Iyer",       Phone = "9876500006", Email = "kavya.i@mail.com",   Address = "22, Subhash Chowk, Ward 6",     AssignedArea = "Ward 6",   AssignedBoothNumbers = "6",   Task = VolunteerTask.Communication,   IsActive = true,  RegisteredAt = DateTime.UtcNow.AddDays(-18), Notes = "Handles social media updates.",             ConstituencyId = constituency.Id },
                new Volunteer { Name = "Rahul Borse",      Phone = "9876500007",                               Address = "61, Patel Wadi, Ward 7",        AssignedArea = "Ward 7",   AssignedBoothNumbers = "7",   Task = VolunteerTask.VoterOutreach,   IsActive = true,  RegisteredAt = DateTime.UtcNow.AddDays(-15), Notes = "Active in local sports club.",              ConstituencyId = constituency.Id },
                new Volunteer { Name = "Deepa Sawant",     Phone = "9876500008", Email = "deepa.s@mail.com",   Address = "14, Laxmi Nagar, Ward 8",       AssignedArea = "Ward 8",   AssignedBoothNumbers = "8",   Task = VolunteerTask.BoothManagement, IsActive = true,  RegisteredAt = DateTime.UtcNow.AddDays(-12), Notes = "Women's group coordinator.",               ConstituencyId = constituency.Id },
                new Volunteer { Name = "Suresh Mane",      Phone = "9876500009",                               Address = "77, Gandhi Nagar, Ward 1",      AssignedArea = "Ward 1,2", AssignedBoothNumbers = "1,2", Task = VolunteerTask.Transport,       IsActive = true,  RegisteredAt = DateTime.UtcNow.AddDays(-10), Notes = "Coordinates vehicle pooling.",              ConstituencyId = constituency.Id },
                new Volunteer { Name = "Anita Pawar",      Phone = "9876500010", Email = "anita.p@mail.com",   Address = "5, Nehru Vihar, Ward 2",        AssignedArea = "Ward 2,3", AssignedBoothNumbers = "2,3", Task = VolunteerTask.DataEntry,       IsActive = false, RegisteredAt = DateTime.UtcNow.AddDays(-8),  Notes = "On medical leave till further notice.",     ConstituencyId = constituency.Id },
                new Volunteer { Name = "Vikram Salunkhe",  Phone = "9876500011",                               Address = "99, Shivaji Park, Ward 3",      AssignedArea = "Ward 3,4", AssignedBoothNumbers = "3,4", Task = VolunteerTask.Other,           IsActive = true,  RegisteredAt = DateTime.UtcNow.AddDays(-5),  Notes = "Logistics and supply management.",          ConstituencyId = constituency.Id },
                new Volunteer { Name = "Manisha Thorat",   Phone = "9876500012", Email = "manisha.t@mail.com", Address = "38, Ambedkar Colony, Ward 4",   AssignedArea = "Ward 4,5", AssignedBoothNumbers = "4,5", Task = VolunteerTask.VoterOutreach,   IsActive = true,  RegisteredAt = DateTime.UtcNow.AddDays(-3),  Notes = "Conducts door-to-door voter education.",   ConstituencyId = constituency.Id }
            );
            await db.SaveChangesAsync();
        }

        // ?? Grievances ???????????????????????????????????????????????????????
        if (!db.Grievances.Any())
        {
            var constituency = db.Constituencies.First();
            var now = DateTime.UtcNow;
            db.Grievances.AddRange(
                new Grievance { Title = "Broken Road Near School", Description = "The main road in front of the primary school in Ward 1 has large potholes causing accidents, especially during rainy season. Needs immediate repair.", ReportedBy = "Mahesh Tiwari", ReporterPhone = "9900011001", Ward = "1", BoothNumber = 1, Priority = GrievancePriority.High, Status = GrievanceStatus.Open, Location = "Gandhi Nagar, Ward 1", ConstituencyId = constituency.Id, ReportedAt = now.AddDays(-22) },
                new Grievance { Title = "No Street Lights on Main Road", Description = "Street lights on the stretch from Nehru Vihar to Subhash Chowk have been non-functional for over a month. Residents fear for safety at night.", ReportedBy = "Lata Borkar", ReporterPhone = "9900011002", Ward = "2", BoothNumber = 2, Priority = GrievancePriority.Medium, Status = GrievanceStatus.InProgress, AssignedToName = "Campaign Manager", Location = "Nehru Vihar, Ward 2", ConstituencyId = constituency.Id, ReportedAt = now.AddDays(-18) },
                new Grievance { Title = "Water Supply Disruption", Description = "Water supply has been irregular for three weeks in Ward 3. Residents in the eastern part receive water only twice a week, which is insufficient.", ReportedBy = "Ganesh Parab", ReporterPhone = "9900011003", Ward = "3", BoothNumber = 3, Priority = GrievancePriority.Critical, Status = GrievanceStatus.Open, Location = "Shivaji Park, Ward 3", ConstituencyId = constituency.Id, ReportedAt = now.AddDays(-16) },
                new Grievance { Title = "Garbage Not Collected for 2 Weeks", Description = "Garbage collection van has not visited Ward 4 for over two weeks. Waste is piling up near Ambedkar Colony chowk, causing hygiene issues.", ReportedBy = "Sunita Rao", ReporterPhone = "9900011004", Ward = "4", BoothNumber = 4, Priority = GrievancePriority.High, Status = GrievanceStatus.Resolved, AssignedToName = "Field Worker 1", ResolutionNotes = "Escalated to municipal authority. Collection resumed from 20th.", Location = "Ambedkar Colony, Ward 4", ConstituencyId = constituency.Id, ReportedAt = now.AddDays(-14), ResolvedAt = now.AddDays(-5) },
                new Grievance { Title = "Illegal Construction Blocking Road", Description = "An unauthorized structure is being erected at the entrance of Tilak Nagar, blocking vehicular movement. Local residents have complained multiple times.", ReportedBy = "Ranjit More", ReporterPhone = "9900011005", Ward = "5", BoothNumber = 5, Priority = GrievancePriority.High, Status = GrievanceStatus.Open, Location = "Tilak Nagar, Ward 5", ConstituencyId = constituency.Id, ReportedAt = now.AddDays(-12) },
                new Grievance { Title = "Stray Dogs Menace Near Booth 6", Description = "A large pack of stray dogs near the community park in Ward 6 is terrorising children and elderly residents. Animal control intervention urgently required.", ReportedBy = "Fatima Sheikh", ReporterPhone = "9900011006", Ward = "6", BoothNumber = 6, Priority = GrievancePriority.Medium, Status = GrievanceStatus.InProgress, AssignedToName = "Campaign Manager", Location = "Subhash Chowk, Ward 6", ConstituencyId = constituency.Id, ReportedAt = now.AddDays(-10) },
                new Grievance { Title = "Drainage Overflow in Ward 7", Description = "The drainage system near Patel Wadi overflows during heavy rains, flooding nearby houses. Repeated complaints to the civic body have gone unheeded.", ReportedBy = "Harish Nair", ReporterPhone = "9900011007", Ward = "7", BoothNumber = 7, Priority = GrievancePriority.Critical, Status = GrievanceStatus.Open, Location = "Patel Wadi, Ward 7", ConstituencyId = constituency.Id, ReportedAt = now.AddDays(-9) },
                new Grievance { Title = "Election Voter List Correction Needed", Description = "Several registered voters in Ward 8 (Laxmi Nagar) find their names missing from the updated voter list. Requires urgent correction before election day.", ReportedBy = "Priti Gaikwad", ReporterPhone = "9900011008", Ward = "8", BoothNumber = 8, Priority = GrievancePriority.Critical, Status = GrievanceStatus.InProgress, AssignedToName = "Campaign Manager", Location = "Laxmi Nagar, Ward 8", ConstituencyId = constituency.Id, ReportedAt = now.AddDays(-8) },
                new Grievance { Title = "Government School Lacks Drinking Water", Description = "The government primary school in Ward 1 does not have a functional water purifier. Students are forced to drink tap water, causing health concerns.", ReportedBy = "Sanjay Kale", ReporterPhone = "9900011009", Ward = "1", BoothNumber = 1, Priority = GrievancePriority.Medium, Status = GrievanceStatus.Resolved, AssignedToName = "Field Worker 1", ResolutionNotes = "RO unit installed by constituency fund on request.", Location = "Gandhi Nagar School, Ward 1", ConstituencyId = constituency.Id, ReportedAt = now.AddDays(-20), ResolvedAt = now.AddDays(-6) },
                new Grievance { Title = "Encroachment on Public Park", Description = "A portion of the community park in Ward 2 has been encroached upon for commercial use. Residents want the encroachment removed and the park restored.", ReportedBy = "Rekha Chavan", ReporterPhone = "9900011010", Ward = "2", BoothNumber = 2, Priority = GrievancePriority.Low, Status = GrievanceStatus.Open, Location = "Nehru Vihar Park, Ward 2", ConstituencyId = constituency.Id, ReportedAt = now.AddDays(-7) },
                new Grievance { Title = "Bus Stop in Dilapidated Condition", Description = "The bus stop shelter near Booth 3 in Shivaji Park is in very poor condition. The roof leaks, and the seating is broken. Commuters request refurbishment.", ReportedBy = "Abhay Patil", ReporterPhone = "9900011011", Ward = "3", BoothNumber = 3, Priority = GrievancePriority.Low, Status = GrievanceStatus.Open, Location = "Shivaji Park Bus Stop, Ward 3", ConstituencyId = constituency.Id, ReportedAt = now.AddDays(-6) },
                new Grievance { Title = "Electricity Outage Lasting 8+ Hours", Description = "Ward 5 experienced electricity outages of 8 to 10 hours consecutively for the past week. Residents with medical equipment are severely affected.", ReportedBy = "Neha Deshpande", ReporterPhone = "9900011012", Ward = "5", BoothNumber = 5, Priority = GrievancePriority.High, Status = GrievanceStatus.Resolved, AssignedToName = "Campaign Manager", ResolutionNotes = "Reported to electricity board; transformer repaired on priority.", Location = "Tilak Nagar, Ward 5", ConstituencyId = constituency.Id, ReportedAt = now.AddDays(-15), ResolvedAt = now.AddDays(-4) },
                new Grievance { Title = "Public Toilet Non-Functional Near Booth 6", Description = "The only public toilet near the booth 6 polling station in Ward 6 has been locked and non-functional for a month. Residents are inconvenienced.", ReportedBy = "Tushar Ghosh", ReporterPhone = "9900011013", Ward = "6", BoothNumber = 6, Priority = GrievancePriority.Medium, Status = GrievanceStatus.Open, Location = "Subhash Chowk, Ward 6", ConstituencyId = constituency.Id, ReportedAt = now.AddDays(-5) },
                new Grievance { Title = "Road Widening Project Stalled", Description = "The road widening project at the Ward 7�8 boundary announced six months ago has been stalled. Heavy traffic is causing daily jams and accidents.", ReportedBy = "Smita Londhe", ReporterPhone = "9900011014", Ward = "7", BoothNumber = 7, Priority = GrievancePriority.High, Status = GrievanceStatus.InProgress, AssignedToName = "Campaign Manager", Location = "Patel Wadi�Laxmi Nagar boundary", ConstituencyId = constituency.Id, ReportedAt = now.AddDays(-4) },
                new Grievance { Title = "Senior Citizen Pension Not Disbursed", Description = "Multiple senior citizens in Ward 8 have not received their monthly pension for the past two months. They request urgent follow-up with the concerned office.", ReportedBy = "Vinod Kamble", ReporterPhone = "9900011015", Ward = "8", BoothNumber = 8, Priority = GrievancePriority.High, Status = GrievanceStatus.Open, Location = "Laxmi Nagar, Ward 8", ConstituencyId = constituency.Id, ReportedAt = now.AddDays(-3) }
            );
            await db.SaveChangesAsync();
        }

        // ?? Surveys & Feedback ???????????????????????????????????????????????
        if (!db.Surveys.Any())
        {
            var constituency = db.Constituencies.First();
            var rnd = new Random(7);

            var survey1 = new Survey
            {
                Title = "Candidate Awareness Survey",
                Description = "How aware are voters about the candidate's background, vision, and election promises?",
                Category = SurveyCategory.CandidateAwareness,
                ConstituencyId = constituency.Id,
                IsActive = true,
                CreatedAt = DateTime.UtcNow.AddDays(-18)
            };
            var survey2 = new Survey
            {
                Title = "Local Development Issues",
                Description = "Identify the top infrastructure and development concerns in each ward.",
                Category = SurveyCategory.LocalIssues,
                ConstituencyId = constituency.Id,
                IsActive = true,
                CreatedAt = DateTime.UtcNow.AddDays(-12)
            };
            var survey3 = new Survey
            {
                Title = "Party Support & General Opinion",
                Description = "Gauge voter sentiment towards the party and the current political climate.",
                Category = SurveyCategory.GeneralOpinion,
                ConstituencyId = constituency.Id,
                IsActive = true,
                CreatedAt = DateTime.UtcNow.AddDays(-6)
            };

            var respondents = new[]
            {
                ("Mahesh Tiwari",   "9900011001", "Ward 1", 1),
                ("Lata Borkar",     "9900011002", "Ward 1", 1),
                ("Ganesh Parab",    "9900011003", "Ward 2", 2),
                ("Sunita Rao",      "9900011004", "Ward 2", 2),
                ("Ranjit More",     "9900011005", "Ward 3", 3),
                ("Fatima Sheikh",   "9900011006", "Ward 3", 3),
                ("Harish Nair",     "9900011007", "Ward 4", 4),
                ("Priti Gaikwad",   "9900011008", "Ward 4", 4),
                ("Sanjay Kale",     "9900011009", "Ward 5", 5),
                ("Rekha Chavan",    "9900011010", "Ward 5", 5),
                ("Abhay Patil",     "9900011011", "Ward 6", 6),
                ("Neha Deshpande",  "9900011012", "Ward 6", 6),
                ("Tushar Ghosh",    "9900011013", "Ward 7", 7),
                ("Smita Londhe",    "9900011014", "Ward 7", 7),
                ("Vinod Kamble",    "9900011015", "Ward 8", 8),
            };

            var feedbackPool = new[]
            {
                "Very impressed with the candidate's roadmap for our area.",
                "Roads and drainage need urgent attention.",
                "Need more public parks and street lights.",
                "Happy with the outreach efforts; more visits needed.",
                "Employment for youth is our top priority.",
                "Water supply is erratic, especially in summer.",
                "Candidate has a good track record in public service.",
                "Garbage collection is a major issue in our ward.",
                "We want better government schools and hospitals.",
                "Strong support from our community for the party.",
                "Neutral � we'll decide based on manifesto.",
                "Local leaders are unresponsive to daily complaints.",
                "Great initiative; we hope promises are kept.",
                "Traffic management needs significant improvement.",
                "Women's safety must be addressed as a priority."
            };

            survey1.Responses = respondents.Take(12).Select((r, i) => new SurveyResponse
            {
                RespondentName = r.Item1, RespondentPhone = r.Item2, Ward = r.Item3, BoothNumber = r.Item4,
                Rating = 3 + (i % 3), Feedback = feedbackPool[i % feedbackPool.Length],
                RespondedAt = DateTime.UtcNow.AddDays(-15 + i)
            }).ToList();

            survey2.Responses = respondents.Skip(2).Take(11).Select((r, i) => new SurveyResponse
            {
                RespondentName = r.Item1, RespondentPhone = r.Item2, Ward = r.Item3, BoothNumber = r.Item4,
                Rating = 2 + (i % 4), Feedback = feedbackPool[(i + 3) % feedbackPool.Length],
                RespondedAt = DateTime.UtcNow.AddDays(-9 + i)
            }).ToList();

            survey3.Responses = respondents.Skip(4).Take(10).Select((r, i) => new SurveyResponse
            {
                RespondentName = r.Item1, RespondentPhone = r.Item2, Ward = r.Item3, BoothNumber = r.Item4,
                Rating = 1 + (i % 5), Feedback = feedbackPool[(i + 6) % feedbackPool.Length],
                RespondedAt = DateTime.UtcNow.AddDays(-4 + i)
            }).ToList();

            db.Surveys.AddRange(survey1, survey2, survey3);
            await db.SaveChangesAsync();
        }
    }
}
