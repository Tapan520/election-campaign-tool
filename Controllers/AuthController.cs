using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Nirvachak_AI.Domain.Entities;
using Nirvachak_AI.Infrastructure.Services;
using Nirvachak_AI.Models.Api;

namespace Nirvachak_AI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ApiBaseController
{
    private readonly UserManager<AppUser> _userManager;
    private readonly SignInManager<AppUser> _signInManager;
    private readonly JwtTokenService _jwtService;

    public AuthController(UserManager<AppUser> userManager,
        SignInManager<AppUser> signInManager,
        JwtTokenService jwtService)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _jwtService = jwtService;
    }

    /// <summary>Login and get JWT token (for mobile app)</summary>
    [HttpPost("login")]
    [ProducesResponseType(typeof(LoginResponse), 200)]
    [ProducesResponseType(401)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new ApiResult(false, "Email and password are required."));

        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user is null || !user.IsActive)
            return Unauthorized(new ApiResult(false, "Invalid credentials or account disabled."));

        var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, false);
        if (!result.Succeeded)
            return Unauthorized(new ApiResult(false, "Invalid credentials."));

        var (token, expiresAt) = _jwtService.GenerateToken(user);
        return Ok(new LoginResponse(token, expiresAt, user.FullName,
            user.Role.ToString(), user.ConstituencyId, user.Id));
    }

    /// <summary>Get current authenticated user info</summary>
    [HttpGet("me")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [ProducesResponseType(typeof(LoginResponse), 200)]
    public async Task<IActionResult> Me()
    {
        var user = await _userManager.FindByIdAsync(GetUserId());
        if (user is null) return Unauthorized();
        return Ok(new LoginResponse(string.Empty, DateTime.UtcNow,
            user.FullName, user.Role.ToString(), user.ConstituencyId, user.Id));
    }
}
