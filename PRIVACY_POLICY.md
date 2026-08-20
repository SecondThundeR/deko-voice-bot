# Privacy Policy

Last updated: August 20, 2026

This Privacy Policy explains how the Deko Voice Bot for Telegram (the "Bot"), operated by Uladzislau Hramyka in Belarus (the "Service Provider"), collects, uses, stores, and shares information. The Bot is provided free of charge and on an "AS IS" basis. Optional donations are processed through Telegram Stars.

## Information We Process

### Usage and profile information

Unless you opt out, when you send a voice quote through the Bot's inline mode, the Bot stores:

- your Telegram user ID;
- your Telegram first and last name, where available;
- your Telegram username, where available;
- the total number of voice quotes you have sent; and
- the date and time when you most recently sent a voice quote.

The Bot also stores your selected favorite voice quotes if you use the favorites feature. Favorites are associated with your Telegram user ID.

### Payments

If you make a donation using Telegram Stars, the Bot stores:

- your Telegram user ID;
- the Telegram payment charge ID;
- a random invoice identifier that does not contain your Telegram user ID or creation time;
- the amount paid;
- the payment time; and
- the payment or refund status.

This information is used to record the payment, prevent duplicate processing, and handle refunds. The Service Provider does not receive or store payment-card or bank-account details. Payments are processed by Telegram under Telegram's own terms and privacy policy.

### Messages, queries, and technical information

Telegram sends the Bot the information contained in updates needed to handle your interaction. Depending on how you use the Bot, this may include your profile information, messages and commands sent to the Bot, inline search queries, selected voice quotes, callback data, payment notifications, Telegram file identifiers, chat identifiers, message identifiers, and Telegram update identifiers.

Most message and query content is processed only to provide the requested feature and is not stored in the Bot's main database. However:

- temporary session and conversation data is kept in the Bot process memory for up to 24 hours after the latest session write and is discarded when the process restarts; and
- operational logs record technical events such as the Telegram update identifier and type, handler name, Bot API method and payload field names (but not payload values), voice and file identifiers from the Bot's non-user voice catalog, processing time, and sanitized error type, code, message, and stack trace. Error details are automatically redacted for common user and chat identifiers, Telegram usernames, email addresses, bot tokens, payment and file identifiers, and home-directory names. Message contents, inline search text, Telegram profile fields, user and chat identifiers, payment payloads, complete Telegram updates, and Bot API payload values are not intentionally written to application logs.

Application logs created by versions of the Bot deployed before August 12, 2026 may contain more detailed Telegram updates, Bot API payloads, or error details. Those legacy logs remain subject to the hosting provider's configured retention and deletion controls.

The Bot's HTTP server may also log request methods, known application paths (unknown paths are recorded only as "other"), response status codes, processing times, and randomly generated request identifiers when debug logging is enabled. Query parameters and IP addresses are not intentionally written to the application's request-log entries, although the hosting provider may process network information as part of providing and securing its infrastructure. The Bot's server and PostgreSQL database are hosted in the Netherlands.

## How We Use Information

The Service Provider processes information to:

- operate the Bot and respond to requests;
- provide personalized features such as favorites;
- maintain aggregate and individual usage statistics, including total and monthly active-user counts and engagement statistics;
- display administrative statistics, which may include the names, usernames, usage counts, and last-use times of the most active and most recently active users;
- process donations and refunds;
- prevent duplicate usage and payment processing;
- diagnose errors, maintain security, and prevent abuse; and
- create and restore administrative database backups.

The Service Provider does not sell your personal information or use it for advertising.

## Opting Out and Deletion

You can opt out of usage analytics by sending `/optout` in a private chat with the Bot. Opting out:

- deletes your saved first and last name and username;
- resets your usage count and last-use time;
- keeps your favorites available; and
- prevents future inline-send activity from updating your personal usage profile or including you in identified user rankings while you remain opted out.

To remember and honor your choice, the Bot retains your Telegram user ID together with an opt-out flag. This record may still contribute to aggregate statistics, such as the total number of users who opted out, but your cleared profile and activity are not shown in individual statistics. Therefore, `/optout` does not delete every record containing your Telegram user ID. Payment records are also retained after opt-out as part of the Bot's complete payment history and for refunds, dispute handling, security, and compliance obligations. Technical logs and copies in existing manually created exports are not deleted by the `/optout` command.

You can opt back in by sending `/optin` in a private chat. This restores collection of your profile and usage statistics from that point forward. Previously cleared profile and usage statistics are not restored; favorites were not deleted and remain available.

For a broader deletion request, contact the Service Provider at awayfromgalaxy@gmail.com. Some information may still need to be retained where necessary to honor your opt-out, process or document payments and refunds, resolve disputes, maintain security, or comply with applicable law. Data already held by Telegram must be managed through Telegram.

## Access to Your Information

You can use `/mydata` in a private chat with the Bot to view your Telegram user ID, favorites count, analytics status and, while analytics are enabled, the available name and username, usage count, and last-use time stored in the Bot's users database. This command does not list individual favorites, payment records, temporary session data, technical records, logs, or backups.

To request access to other personal information held by the Service Provider, correction of inaccurate information, or a portable copy, contact awayfromgalaxy@gmail.com. These requests are reviewed and fulfilled manually. The Service Provider may need to verify that the Telegram account or payment record belongs to you before fulfilling a request.

## Data Retention

- Active usage profiles are retained while the Bot operates, unless you opt out or request deletion. Favorites remain available after analytics opt-out and are retained unless you request their deletion.
- The Telegram user ID and opt-out flag are retained for as long as necessary to honor the opt-out choice.
- In-memory session and conversation data expires within 24 hours after the latest session write and is discarded when the Bot process restarts.
- Payment records are retained indefinitely as the Bot's complete payment and refund history.
- Railway service logs are retained for 7 days under the Service Provider's current Hobby plan. Railway audit logs are retained for 48 hours.
- Point-in-time recovery is not currently enabled. Administrative database export files may be created manually, and encrypted daily backups may be sent to a private Telegram channel configured by the Service Provider. Backups are authenticated and encrypted before being sent through Telegram, and temporary plaintext and encrypted files are deleted from the Bot host after the operation. Copies delivered through Telegram remain subject to Telegram's storage and retention controls.

## Sharing and Service Providers

Information is processed or shared only as needed to operate the Bot:

- **Telegram** delivers Bot updates, stores communications and files on its platform, sends voice quotes, processes Telegram Stars payments and refunds, and may carry encrypted administrative database exports.
- **Railway** hosts the Bot and its PostgreSQL database in the Netherlands and may process stored data, logs, and network information on the Service Provider's behalf. The current Railway plan does not include database backups.
- **The Service Provider** is the Bot's only administrator and may access user statistics, payment information, logs, and manually created database exports when needed to operate, secure, and maintain the Bot or handle refunds and user requests.

The Service Provider is located in Belarus, while the Bot's primary hosting infrastructure is located in the Netherlands. Consequently, using the Bot involves cross-border processing of personal information. Telegram may also process information in other countries under its own terms, privacy policy, and infrastructure arrangements.

The Service Provider may also disclose information when required by law, to protect users or the Bot, to investigate abuse or security incidents, or in connection with a transfer of the Bot, subject to appropriate safeguards.

## Security

The Service Provider uses reasonable technical and organizational measures intended to protect information against unauthorized access, alteration, disclosure, or loss. No method of transmission or storage is completely secure, so absolute security cannot be guaranteed.

## Changes to This Policy

This Privacy Policy may be updated to reflect changes to the Bot, its service providers, or legal requirements. The "Last updated" date above indicates when the latest revision took effect. Continued use of the Bot after an update means that the revised policy applies to subsequent use, but does not remove any rights available to you under applicable law.

## Contact Us

For questions or requests concerning privacy, contact the Service Provider at awayfromgalaxy@gmail.com.
