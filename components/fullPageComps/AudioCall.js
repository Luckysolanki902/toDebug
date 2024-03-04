//Audio call using simple peer

import React, { useEffect, useRef, useState } from 'react';
import FilterOptions from '@/components/commonComps/FilterOptions';
import styles from './textchat.module.css';
import CustomSnackbar from '../commonComps/Snackbar';
import AudioCallControls from '../audioCallComps/AudioCallControls';
import SimplePeer from 'simple-peer';
import { io } from 'socket.io-client';

const AudioCall = ({ userDetails }) => {
    const [socket, setSocket] = useState(null);
    const [isFindingPair, setIsFindingPair] = useState(false);
    const [strangerDisconnectedMessageDiv, setStrangerDisconnectedMessageDiv] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [preferredGender, setPreferredGender] = useState('any');
    const [preferredCollege, setPreferredCollege] = useState('any')
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarColor, setSnackbarColor] = useState('');
    const [hasPaired, setHasPaired] = useState(false);
    const [usersOnline, setUsersOnline] = useState('');
    const [room, setRoom] = useState('');
    const [receiver, setReceiver] = useState('');
    const [strangerGender, setStrangerGender] = useState('');

    const serverUrl = 'http://localhost:1000';

    const [filters, setFilters] = useState({
        college: userDetails?.college,
        strangerGender: userDetails?.gender === 'male' ? 'female' : 'male',
    });

    const [peer, setPeer] = useState(null);
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null)
    const audioRef = useRef(null);

    useEffect(() => {
        setFilters((prevFilters) => ({
            ...prevFilters,
            college: userDetails?.college || 'any',
            preferredGender: userDetails?.gender === 'male' ? 'female' : 'male',
        }));
    }, [userDetails]);

    useEffect(() => {
        setPreferredCollege(filters.college)
        setPreferredGender(filters.strangerGender)
    }, [filters])


    const init = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setLocalStream(stream);
            console.log('Successfully obtained local stream:', stream);

            const newSocket = io(serverUrl);
            setSocket(newSocket);

            newSocket.on('connect', () => {
                console.log('Connected to server');
                handleIdentify(newSocket);
            });

            newSocket.on('roundedUsersCount', (count) => {
                setUsersOnline(count);
            });

            newSocket.on('pairingSuccess', (data) => {
                handlePairingSuccess(data, newSocket, stream);
            });

            newSocket.on('pairDisconnected', () => {
                handlePairDisconnected();
            });

            newSocket.on('disconnect', () => {
                setSocket(null);
            });

            newSocket.on('error', (error) => {
                console.error('Socket error:', error);
            });
        } catch (error) {
            console.error('Error getting audio permissions:', error);
        }
    };

    useEffect(() => {

        init();

        return () => {
            if (socket) {
                socket.disconnect();
            }
            if (peer) {
                peer.destroy();
            }
            localStream?.getTracks().forEach(track => track.stop());
        };
    }, []);

    const handleIdentify = (socket) => {
        if (userDetails && filters.college && filters.strangerGender) {
            socket.emit('identify', {
                userEmail: userDetails?.email,
                userGender: userDetails?.gender,
                userCollege: userDetails?.college,
                preferredGender: filters.strangerGender,
                preferredCollege: filters.college,
            });
        }
    }

    const handlePairingSuccess = (data, newSocket, localStream) => {
        if (!hasPaired) {
            setStrangerDisconnectedMessageDiv(false);
            setIsFindingPair(false);

            const { roomId, strangerGender, stranger } = data;
            console.log('stranger:', stranger);
            setRoom(roomId);
            setReceiver(stranger);
            setStrangerGender(strangerGender);

            const snackbarColor = strangerGender === 'male' ? '#0094d4' : '#e3368d';
            setSnackbarColor(snackbarColor);

            const snackbarMessage = `A ${strangerGender === 'male' ? 'boy' : 'girl'} connected`;
            setSnackbarMessage(snackbarMessage);

            setSnackbarOpen(true);
            if (peer) {
                peer.destroy();
            }

            const newPeer = new SimplePeer({
                initiator: true,
                stream: localStream, //adding the localstream in the peer for sharing 
                trickle: false,
                config: {
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' },
                    ],
                },
            }); //this is gonna emit a signal event autoamatically on creation


            // Move the offer-related logic outside of the signal event
            newPeer.on('signal', (data) => {
                // Emitting offer to the stranger
                newSocket.emit('offer', { from: userDetails.email, to: stranger, offer: data });
                console.log('Emitting offer to', stranger, 'from', userDetails.email);
            });

            // Handling received offer on the client
            newSocket.on('offer', (data) => {
                const { from, to, offer } = data;

                console.log('Received offer from', from, 'to', to);

                // Set remote description when the offer is received
                newPeer.signal(offer, (err) => {
                    if (err) {
                        console.error('Error during offer signal:', err);
                    }
                });
            });

            // Handling received answer on the client
            newSocket.on('answer', (data) => {
                const { from, to, answer } = data;

                // Set remote description when the answer is received
                newPeer.signal(answer, (err) => {
                    if (err) {
                        console.error('Error during answer signal:', err);
                    }
                });
            });

            newPeer.on('stream', (remoteAudioStream) => {
                if (audioRef.current) {
                    audioRef.current.srcObject = remoteAudioStream;

                }
            });


            newPeer.on('error', (error) => {
                console.error('Peer error:', error);
            });

            setPeer(newPeer);
            setHasPaired(true);

        }
    };


    const handlePairDisconnected = () => {
        console.log('Partner disconnected');
        setStrangerDisconnectedMessageDiv(true);
        setHasPaired(false);
    }

    const handleFindNew = () => {
        if (socket) {
            setHasPaired(false);
            setIsFindingPair(true);
            setStrangerDisconnectedMessageDiv(false);
            socket.emit('findNewPair', {
                userEmail: userDetails?.email,
                userGender: userDetails?.gender,
                userCollege: userDetails?.college,
                preferredGender: filters.strangerGender,
                preferredCollege: filters.college,
            });

            const timeout = 10000;
            setTimeout(() => {
                setIsFindingPair(false);
            }, timeout);
        }
    };

    const handleFindNewButton = () => {
        if (socket) {
            handleFindNew();
        } else {
            init();
        }
    }

    useEffect(() => {
        console.log(peer)
    }, [peer])

    return (
        <div className={styles.mainC}>
            <div className={styles.filterPos}>
                <FilterOptions
                    filters={filters}
                    setFilters={setFilters}
                    userCollege={userDetails?.college}
                    userGender={userDetails?.gender}
                />
            </div>
            {usersOnline && <div>Users Online: {usersOnline}</div>}
            {strangerDisconnectedMessageDiv && hasPaired && <div>Stranger disconnected</div>}
            {remoteStream && <audio ref={audioRef} autoPlay />}
            <AudioCallControls
                isFindingPair={isFindingPair}
                handleFindNewButton={handleFindNewButton}
            />
            <CustomSnackbar
                open={snackbarOpen}
                onClose={() => setSnackbarOpen(false)}
                message={snackbarMessage}
                color={snackbarColor}
            />
        </div>
    );
};

export default AudioCall;
