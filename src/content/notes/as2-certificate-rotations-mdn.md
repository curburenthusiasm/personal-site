---
title: "AS2 certificate rotations: reading the MDN"
slug: as2-certificate-rotations-reading-the-mdn
description: Separate an inactive relationship from an authentication-failed MDN when troubleshooting an AS2 certificate change.
pubDate: 2026-10-28
draft: true
category: EDI operations
---

An AS2 certificate rotation changes more than an expiration date. The sender and receiver must agree on which certificate is used for signing and which public certificate is trusted for validation. When a transmission fails after a rotation, the Message Disposition Notification is often the first useful clue—but only if the actual disposition is read carefully.

One class of failure is an inactive or misconfigured host relationship. The trading relationship may not be enabled on the expected endpoint, or the connection may still point to an old configuration. In that case, verify the relationship state, URL, encryption expectations, and the certificate assigned to that specific connection. Do not assume that a certificate file uploaded somewhere in the platform is automatically active for every relationship.

An `authentication-failed` MDN points to a different problem. It can mean the receiver could not validate the signature using the certificate it currently trusts. During a rotation, a common cause is that the partner has not yet installed the new signing certificate. The sender may be using the new private key correctly while the receiver still expects the old public key.

The order of checks matters. Confirm the MDN disposition and diagnostic text. Verify which certificate signed the outbound message and its validity window. Confirm the partner has received and activated the corresponding public certificate. Then verify the relationship’s signing, encryption, and acknowledgment settings. Compare fingerprints through the agreed secure channel rather than relying on a display name, which may be reused or truncated.

A safe rotation plan includes overlap where the platform and relationship permit it, an agreed cutover point, a test transmission, and a rollback or escalation path. Record which certificate is active for each relationship and who confirmed the partner-side installation. If messages are being retried, verify idempotency and avoid turning a certificate issue into duplicate business documents.

It also helps to maintain a small rotation matrix: relationship, current signing certificate fingerprint, next fingerprint, activation date, partner confirmation, and test outcome. Keep the matrix in an access-controlled operational record, not in a public runbook. A scheduled reminder is useful, but the authoritative state is the configuration and the successful test, not the reminder itself.

Keep the diagnosis evidence-based. “The certificate was uploaded” does not prove it was used. “The connection is active” does not prove the receiver trusts the signer. The MDN, local configuration, and partner confirmation answer different questions. Treating them separately shortens troubleshooting and reduces the chance of making an unrelated configuration change.

This note uses generic terminology. Partner identifiers, endpoints, and certificate material should never be copied into a public troubleshooting example.
