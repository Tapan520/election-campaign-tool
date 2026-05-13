using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace Nirvachak_AI.Pages
{
    public class IndexModel : PageModel
    {
        public IActionResult OnGet() => RedirectToPage("/Dashboard/Index");
    }
}

