import React, { useState, useEffect } from 'react';
import { AppState } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { CACHE_DIR } from './musicCacheManager';
import { getStorageUrl } from './api';

/**
 * Hook to monitor network connectivity
 */
export const useIsConnected = () => {
    const [isConnected, setIsConnected] = useState(true);

    const checkConnection = async () => {
        const url = getStorageUrl();
        if (!url) {
            setIsConnected(false);
            return;
        }
        try {
            const response = await fetch(`http://www.msftconnecttest.com/connecttest.txt`, { method: 'HEAD', cache: 'no-cache' });
            setIsConnected(response.ok);
        } catch (e) {
            setIsConnected(false);
        }
    };

    useEffect(() => {
        // Initial check
        checkConnection();

        // Check on app state change (e.g. returning to app)
        const subscription = AppState.addEventListener('change', (nextState) => {
            if (nextState === 'active') {
                checkConnection();
            }
        });

        // Periodic check every 10 seconds
        const interval = setInterval(checkConnection, 10000);

        return () => {
            subscription.remove();
            clearInterval(interval);
        };
    }, []);

    return isConnected;
};

/**
 * Hook to track cache status of a list of songs
 */
export const useCacheStatus = (songs) => {
    const [cachedIds, setCachedIds] = useState(new Set());

    const updateCacheStatus = async () => {
        try {
            const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
            if (!dirInfo.exists) {
                setCachedIds(new Set());
                return;
            }

            const files = await FileSystem.readDirectoryAsync(CACHE_DIR);
            // Filenames are typically `${id}.mp3`
            const ids = new Set(files.map(f => f.replace('.mp3', '')));
            setCachedIds(ids);
        } catch (e) {
            console.error('[useCacheStatus] Error:', e);
        }
    };

    useEffect(() => {
        updateCacheStatus();
        
        // Refresh every 5 seconds to catch background downloads
        const interval = setInterval(updateCacheStatus, 5000);
        return () => clearInterval(interval);
    }, [songs]); // Refresh when songs list changes

    return cachedIds;
};
