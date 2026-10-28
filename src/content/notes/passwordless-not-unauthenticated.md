---
title: Passwordless isn’t the same as unauthenticated
slug: passwordless-is-not-unauthenticated
description: A shop-floor kiosk can remove repeated credential entry while retaining a low-privilege identity, application restrictions, and read-only data boundaries.
pubDate: 2026-10-28
draft: true
category: Infrastructure
---

A shared shop-floor screen creates a usability problem: workers need quick access to a small set of operational information, but repeatedly entering individual credentials can slow a task and encourage unsafe workarounds. Removing the password prompt does not require removing the security boundary.

One pattern uses an automatically signed-in, low-privilege account dedicated to the kiosk. Windows Assigned Access can constrain the available application surface. Files exposed to that account can be read-only, and group policy can control power and session behavior. The kiosk should not have general access to email, administrative tools, or unrelated shares just because it is convenient to configure it that way.

The design starts by listing the needed tasks and data. Which page must be visible? Can the account query a read-only view rather than a writable database? What should happen after a reboot, network outage, or browser crash? The answers determine the smallest set of permissions and recovery steps. If an operator must occasionally perform a privileged action, provide a separate authenticated process rather than raising the kiosk account’s baseline rights.

Physical access still matters. A kiosk is located where people can touch it, so lock down the shell, prevent casual access to the desktop, place the device where its screen is appropriate, and define how local ports and removable media are handled. Network segmentation and endpoint management remain relevant even when the only visible interface is a single application.

Updates and maintenance need a deliberate path. A locked-down user experience should not prevent administrators from patching the device or recovering it. Keep a documented maintenance account and procedure, protect its credentials, and make sure it does not become the normal daily login.

Testing should include ordinary and adversarial behavior: try to open a forbidden app, browse to an unrelated location, write to a supposedly read-only file, and recover after the application is closed. Observe what is logged. A configuration that appears restricted in the happy path may still expose an escape route through keyboard shortcuts or a file dialog.

Also test routine operations under the intended account: verify that a network reconnect does not expose cached credentials, that the kiosk returns to its intended screen after a restart, and that support staff can tell whether the device is healthy without using the shared session. These checks make availability and access control part of the same design review.

The aim is not “no authentication.” It is to reduce friction for a narrowly defined, low-risk use case while preserving identity, least privilege, and a meaningful administrative boundary. Passwordless access can be safe when the device account is still an account with deliberate permissions and controls.
