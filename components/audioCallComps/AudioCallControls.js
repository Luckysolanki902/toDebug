// AudioCallControls.js
import React, { useState } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { createTheme, ThemeProvider } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import CachedIcon from '@mui/icons-material/Cached'; // Find New button icon
import styles from '../fullPageComps/textchat.module.css';

// Create a dark theme using createTheme
const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: 'rgb(255, 255, 255)',
        },
    },
});

const AudioCallControls = ({ isFindingPair, handleFindNewButton }) => {
    const [isMicMuted, setIsMicMuted] = useState(false);
    const [isLoudspeakerOn, setIsLoudspeakerOn] = useState(false);

    const toggleMic = () => {
        setIsMicMuted(!isMicMuted);
    };

    const toggleLoudspeaker = () => {
        setIsLoudspeakerOn(!isLoudspeakerOn);
    };

    return (
        // Wrap your component with ThemeProvider and provide the dark theme
        <ThemeProvider theme={darkTheme}>
            <Box sx={{ width: '100%', display: 'flex', gap: '2rem' }}>
                <Button
                    className={styles.iconButton}
                    disabled={isFindingPair}
                    onClick={handleFindNewButton}
                    title="Find New"
                    variant="contained"
                    color="primary"
                >
                    {isFindingPair ? (
                        <CircularProgress size={24} sx={{ color: 'white' }} />
                    ) : (
                        <CachedIcon />
                    )}
                </Button>

                <Button
                    className={styles.iconButton}
                    disabled={isFindingPair}
                    onClick={toggleMic}
                    title={isMicMuted ? 'Unmute' : 'Mute'}
                    variant="contained"
                    color="primary"
                >
                    {isMicMuted ? <MicOffIcon /> : <MicIcon />}
                </Button>
                <Button
                    className={styles.iconButton}
                    disabled={isFindingPair}
                    onClick={toggleLoudspeaker}
                    title={isLoudspeakerOn ? 'Turn off Loudspeaker' : 'Turn on Loudspeaker'}
                    variant="contained"
                    color="primary"
                >
                    {isLoudspeakerOn ? <VolumeUpIcon /> : <VolumeOffIcon />}
                </Button>

            </Box>
        </ThemeProvider>
    );
};

export default AudioCallControls;
