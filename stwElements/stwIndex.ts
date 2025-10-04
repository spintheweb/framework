// SPDX-License-Identifier: MIT
// Shared index map to decouple circular dependency between STWElement and STWSite
// Elements and Site both attach to this registry.

export const STWIndex: Map<string, unknown> = new Map();
