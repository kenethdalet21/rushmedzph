/**
 * Unified Ecosystem Services
 * 
 * This barrel file exports all ecosystem services for easy import
 * across all RushMedz apps.
 */

// Main unified database service
export * from './unifiedDatabaseService';
export { default as unifiedDatabase } from './unifiedDatabaseService';

// React hooks for ecosystem
export * from './useEcosystem';
export { default as useEcosystem } from './useEcosystem';
