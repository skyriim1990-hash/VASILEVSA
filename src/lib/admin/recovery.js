/**
 * ADMIN — PASSWORD RECOVERY
 *
 * The pieces shared by the three pages that make up a password reset:
 * /admin/forgot-password asks for it, /admin/auth/callback turns the emailed
 * link into a session, /admin/reset-password spends that session on a new
 * password.
 *
 * ---------------------------------------------------------------------------
 * WHERE THE LINK IN THE EMAIL POINTS
 * ---------------------------------------------------------------------------
 * Supabase builds the link from two things: the `redirectTo` passed to
 * resetPasswordForEmail, and the allow-list in the project's URL Configuration.
 * If `redirectTo` is not on the allow-list it is discarded silently and the
 * Site URL is used instead — no error, no warning, just a link to the wrong
 * host. That is the whole of the "it opens localhost:3000" symptom: the site
 * never asked for a redirect, so it got the default, and the default was left
 * at the port a create-react-app uses.
 *
 * So both halves have to agree, and neither is verifiable from the other side:
 *   - this file supplies `redirectTo`
 *   - the dashboard must list it under Redirect URLs
 *
 * supabase/config.toml carries the same pair for a local `supabase start`.
 */

import { SITE_URL } from '../supabase/env.js';

/** Where the emailed link lands. Must be allow-listed in Supabase. */
export const CALLBACK_PATH = '/admin/auth/callback';

/** Where the callback sends someone once the recovery session exists. */
export const RESET_PATH = '/admin/reset-password';

/**
 * Shorter than this and the form refuses before Supabase is asked.
 *
 * My choice, not a project requirement: Supabase's own floor is 6 and this is
 * an account that can edit the whole site. If the project is configured
 * stricter than this, Supabase's rejection is surfaced verbatim by
 * describeAuthError below rather than being second-guessed here.
 */
export const MIN_PASSWORD_LENGTH = 8;

/**
 * The origin to build the emailed link from.
 *
 * PUBLIC_SITE_URL when set, because a proxy can make the request's own origin
 * a lie and because the value then lives next to the rest of the deployment
 * config. `context.url.origin` otherwise, which is what makes this work on
 * localhost:4321 with no configuration at all.
 */
export function siteOrigin(context) {
  if (SITE_URL) {
    try {
      return new URL(SITE_URL).origin;
    } catch {
      /* A malformed PUBLIC_SITE_URL should not take the page down; the request
         origin is a reasonable answer and the wrong link is visible in the
         email rather than hidden in a 500. */
    }
  }

  return context.url.origin;
}

/** The absolute URL handed to Supabase as `redirectTo`. */
export function recoveryRedirectTo(context) {
  return `${siteOrigin(context)}${CALLBACK_PATH}`;
}

/**
 * Checks the pair of password boxes. Returns a list so both problems can be
 * reported at once instead of one per submit.
 */
export function validatePassword(password, confirm) {
  const errors = [];

  if (!password) {
    errors.push('Enter a new password.');
  } else if (password.length < MIN_PASSWORD_LENGTH) {
    errors.push(`The password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }

  /* Only worth saying once the first box holds something — otherwise an empty
     form reports two failures for one mistake. */
  if (password && password !== confirm) {
    errors.push('The two passwords do not match.');
  }

  return errors;
}

/**
 * Supabase's auth errors, in words that say what to do next.
 *
 * Anything unrecognised is passed through rather than replaced with a generic
 * line: a message nobody anticipated is more useful than "something went
 * wrong", and this is a panel with one user, not a public sign-up form where
 * the text itself leaks information.
 */
export function describeAuthError(error) {
  if (!error) return '';

  const message = String(error.message ?? '');

  if (/rate limit|too many requests|after \d+ seconds/i.test(message)) {
    return 'Too many attempts. Supabase limits how many recovery emails it will send in an hour — wait and try again.';
  }

  if (/same as the old|should be different/i.test(message)) {
    return 'That is the password the account already has. Choose a different one.';
  }

  if (/weak|password should be|at least \d+ characters/i.test(message)) {
    return `Supabase rejected that password: ${message}`;
  }

  /* The commonest real failure, and the one whose stock message is worst: the
     SDK answers with a paragraph about Next.js and SvelteKit that reads as a
     bug in this app rather than as "you opened it somewhere else". */
  if (/code verifier/i.test(message)) {
    return 'This link has to be opened in the browser it was requested from — the one-time key it is checked against was left there. Request a new link from this browser.';
  }

  if (/auth session missing|session_not_found|jwt expired|invalid claim/i.test(message)) {
    return 'The recovery session has expired. Ask for a new link and use it straight away.';
  }

  if (/expired|invalid|already been used/i.test(message)) {
    return 'That link is no longer valid — recovery links expire and work once. Ask for a new one.';
  }

  return message;
}
