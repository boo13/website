# PRD: Newsletter Form Buttondown Integration

## Introduction

Connect the existing newsletter signup form in `v4/index.html` to Buttondown's email subscription API. When a user submits their email, provide a satisfying animated confirmation, replacing the form with a thank-you message. Handle errors gracefully with a shake animation and inline error messaging.

## Goals

- Integrate newsletter form with Buttondown API for email collection
- Provide smooth, satisfying success animation that replaces the form with a thank-you message
- Handle errors with shake animation and clear error messaging
- Maintain existing visual design and accessibility

## User Stories

### US-001: Submit email to Buttondown API
**Description:** As a visitor, I want to subscribe to the newsletter so that I receive updates on new projects.

**Acceptance Criteria:**
- [ ] Form submits email to Buttondown API endpoint
- [ ] Submission happens via JavaScript (no page reload)
- [ ] Button shows loading state during submission
- [ ] Buttondown API key is configured (user will provide)
- [ ] Typecheck/lint passes

### US-002: Success animation and confirmation
**Description:** As a visitor, I want to see a satisfying confirmation when I subscribe so that I know it worked.

**Acceptance Criteria:**
- [ ] On success, form smoothly transitions/fades out
- [ ] Thank-you message fades in to replace the form
- [ ] Message includes checkmark icon and "You're subscribed!" text
- [ ] Animation is smooth (300-400ms duration)
- [ ] Verify in browser using dev-browser skill

### US-003: Error handling with shake animation
**Description:** As a visitor, I want clear feedback if something goes wrong so that I can fix the issue.

**Acceptance Criteria:**
- [ ] Invalid email shows inline error message below input
- [ ] API errors show user-friendly error message
- [ ] Form shakes horizontally on error (subtle, ~3 shakes)
- [ ] Error message is red/visible but not jarring
- [ ] User can retry submission after error
- [ ] Verify in browser using dev-browser skill

## Functional Requirements

- FR-1: Add JavaScript to handle form submission via `fetch()` to Buttondown API
- FR-2: Buttondown endpoint: `https://api.buttondown.email/v1/subscribers`
- FR-3: Show loading spinner or "Subscribing..." text on button during API call
- FR-4: On success (201 response): fade out form, fade in success message
- FR-5: On error: apply shake animation to form, display error message
- FR-6: Validate email format client-side before submission
- FR-7: Preserve existing form styling and accessibility attributes

## Non-Goals

- No double opt-in configuration (handled by Buttondown settings)
- No CAPTCHA or spam protection (rely on Buttondown's built-in protection)
- No email preference options or additional form fields
- No analytics tracking of submissions

## Design Considerations

- Success message should match existing typography (`section-title`, `newsletter-intro` classes)
- Checkmark icon should be simple SVG, matching site aesthetic
- Shake animation: `translateX` keyframes, 3 oscillations, ~300ms total
- Fade transitions: 300-400ms ease-in-out
- Error text color: use a muted red that fits the site palette

## Technical Considerations

- Buttondown API requires `Authorization: Token <API_KEY>` header
- API key should NOT be committed to repo—user must configure securely
- Consider using a simple proxy or environment variable approach
- Form must work without JavaScript (graceful degradation to Buttondown hosted form)
- CSS animations should be defined in the existing stylesheet or inline `<style>` block

## Success Metrics

- User sees confirmation within 2 seconds of submission
- Error states are immediately clear and actionable
- No console errors during normal operation
- Animation feels polished and intentional

## Open Questions

- Where will the Buttondown API key be stored? (inline for static site, or proxy endpoint?)
- Should success message auto-dismiss after some time, or persist?
- Preferred checkmark icon style (outlined, filled, animated draw)?
