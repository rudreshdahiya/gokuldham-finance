const database = {
    countries: [
        {
            id: "india",
            name: "India",
            lat: 20.5937,
            lng: 78.9629,
            mapImage: "assets/images/map_india.jpg",
            cities: [
                {
                    id: 1,
                    name: "Delhi",
                    lat: 28.6139,
                    lng: 77.2090,
                    people: [
                        {
                            id: 1,
                            name: "Pronil",
                            thumbnailImage: "assets/images/thumbnail/thumbnail_pronil.jpg",
                            puzzleImage: "assets/images/puzzle_pronil.jpg",
                            solvedImage: "assets/images/puzzle_pronil.jpg",
                            galleryImages: [],
                            letterImage: "assets/images/letter_placeholder.jpg",
                            audioFile: "assets/audio/placeholder_message.mp3",
                            videoFile: "assets/audio/pronil/pronil_video.mp4",
                            skipPuzzle: true,
                            videoFocus: true,
                            hideAudio: true,
                            hideWhatsapp: true,
                            phoneNumber: ""
                        },

                        {
                            id: 3,
                            name: "Shyamoli",
                            thumbnailImage: "assets/images/thumbnail/thumbnail_shyamoli.jpg",
                            puzzleImage: "assets/images/shyamoli/shyamoli_puzzle.jpg",
                            solvedImage: "assets/images/shyamoli/shyamoli_puzzle.jpg",
                            galleryImages: [
                                "assets/images/shyamoli/shyamoli_1.jpg",
                                "assets/images/shyamoli/shyamoli_2.jpg"
                            ],
                            letterPdf: "assets/images/shyamoli/Shyamoli.pdf",
                            letterImage: "assets/images/letter_placeholder.jpg",
                            audioFile: "assets/audio/placeholder_message.mp3",
                            hideAudio: true,
                            hideWhatsapp: true,
                            phoneNumber: ""
                        },
                        {
                            id: 4,
                            name: "Dennis",
                            thumbnailImage: "assets/images/thumbnail/thumbnail_dennis.jpg",
                            puzzleImage: "assets/audio/dennis/dennis_puzzle.jpg",
                            solvedImage: "assets/audio/dennis/dennis_puzzle.jpg",
                            galleryImages: ["assets/audio/dennis/dennis_1.jpg"],
                            letterImage: "assets/images/letter_placeholder.jpg",
                            audioFile: "assets/audio/dennis/dennis.oga",
                            rightSideAudio: true,
                            transcription: "Voice note from Dennis.",
                            hideAudio: true,
                            hideWhatsapp: true,
                            phoneNumber: ""
                        }
                    ],
                    mapImage: "assets/images/map_delhi.png"
                },
                {
                    id: 5,
                    name: "Bhubaneswar",
                    lat: 20.2961,
                    lng: 85.8245,
                    people: [
                        {
                            id: 5,
                            name: "Brishti",
                            thumbnailImage: "assets/images/thumbnail/thumbnail_brishti.jpg",
                            puzzleImage: "assets/images/brishti/brishti_puzzle.jpg",
                            solvedImage: "assets/images/brishti/brishti_puzzle.jpg",
                            galleryImages: ["assets/images/brishti/brishti_image2.jpg"],
                            letterPdf: "assets/images/brishti/brishti_gift.pdf",
                            letterImage: "assets/images/letter_placeholder.jpg",
                            audioFile: "assets/audio/placeholder_message.mp3",
                            hideAudio: true,
                            hideWhatsapp: true,
                            phoneNumber: ""
                        }
                    ],
                    mapImage: "assets/images/map_placeholder.jpg"
                },
                {
                    id: 6,
                    name: "Kolkata",
                    lat: 22.5726,
                    lng: 88.3639,
                    people: [
                        {
                            id: 6,
                            name: "Royina",
                            thumbnailImage: "assets/images/thumbnail/thumbnail_royina.jpg",
                            puzzleImage: "assets/images/royina/royina_letter.jpg",
                            solvedImage: "assets/images/royina/royina_letter.jpg",
                            galleryImages: [],
                            letterImage: "assets/images/royina/royina_letter.jpg",
                            audioFile: "assets/audio/placeholder_message.mp3",
                            skipPuzzle: true,
                            hideAudio: true,
                            hideWhatsapp: true,
                            phoneNumber: ""
                        },
                        {
                            id: 7,
                            name: "Mukula",
                            thumbnailImage: "assets/images/thumbnail/thumbnail_mukula.jpg",
                            puzzleImage: "assets/images/mukula/mukula_puzzle.jpg",
                            solvedImage: "assets/images/mukula/mukula_puzzle.jpg",
                            galleryImages: [],
                            letterPdf: "assets/images/mukula/mukula.pdf",
                            letterImage: "assets/images/letter_placeholder.jpg",
                            audioFile: "assets/audio/placeholder_message.mp3",
                            hideAudio: true,
                            hideWhatsapp: true,
                            phoneNumber: ""
                        },
                        {
                            id: 8,
                            name: "Dishari",
                            thumbnailImage: "assets/images/thumbnail/thumbnail_dishari.jpg",
                            puzzleImage: "assets/images/dishari/dishari_image.jpg",
                            solvedImage: "assets/images/dishari/dishari_image.jpg",
                            galleryImages: [],
                            letterImage: "assets/images/dishari/dishari_image.jpg",
                            audioFile: "assets/audio/placeholder_message.mp3",
                            skipPuzzle: true,
                            hideAudio: true,
                            hideWhatsapp: true,
                            phoneNumber: ""
                        }
                    ],
                    mapImage: "assets/images/map_placeholder.jpg"
                },
                {
                    id: 9,
                    name: "Ahmedabad",
                    lat: 23.0225,
                    lng: 72.5714,
                    people: [
                        {
                            id: 9,
                            name: "Juhi",
                            thumbnailImage: "assets/images/thumbnail/thumbnail_juhi.jpg",
                            puzzleImage: "assets/audio/juhi/juhi_puzzle.jpg",
                            solvedImage: "assets/audio/juhi/juhi_puzzle.jpg",
                            galleryImages: ["assets/audio/juhi/juhi_1.jpg"],
                            letterImage: "assets/images/letter_placeholder.jpg",
                            audioFile: "assets/audio/juhi/juhi_audio.ogg",
                            rightSideAudio: true,
                            transcription: "Voice note from Juhi.",
                            hideAudio: true,
                            hideWhatsapp: true,
                            phoneNumber: ""
                        }
                    ],
                    mapImage: "assets/images/map_placeholder.jpg"
                },
                {
                    id: 11,
                    name: "Mumbai",
                    lat: 19.0760,
                    lng: 72.8777,
                    people: [
                        {
                            id: 11,
                            name: "Swamiji",
                            thumbnailImage: "assets/images/thumbnail/thumbnail_swamiji.jpg",
                            puzzleImage: "assets/images/placeholder_puzzle.jpg",
                            solvedImage: "assets/images/placeholder_solved.jpg",
                            galleryImages: [],
                            letterImage: "assets/images/letter_placeholder.jpg",
                            audioFile: "assets/audio/swamiji/swamiji.ogg",
                            skipPuzzle: true,
                            audioFocus: true,
                            transcription: "Voice note from Swamiji.",
                            hideAudio: true,
                            hideWhatsapp: true,
                            phoneNumber: ""
                        },
                        {
                            id: 12,
                            name: "Nayantara",
                            thumbnailImage: "assets/images/thumbnail/thumbnail_nayantara.jpg",
                            puzzleImage: "assets/images/nayantara/nayan_puzzle.jpg",
                            solvedImage: "assets/images/nayantara/nayan_puzzle.jpg",
                            galleryImages: [
                                "assets/images/nayantara/nayan_1.jpg",
                                "assets/images/nayantara/nayan_2.jpg"
                            ],
                            letterImage: "assets/images/nayantara/nayan_letter.jpg",
                            audioFile: "assets/audio/placeholder_message.mp3",
                            hideAudio: true,
                            hideWhatsapp: true,
                            phoneNumber: ""
                        },

                        {
                            id: 14,
                            name: "Jai",
                            thumbnailImage: "assets/images/thumbnail/thumbnail_jai.jpg",
                            puzzleImage: "assets/images/placeholder_puzzle.jpg",
                            solvedImage: "assets/images/placeholder_solved.jpg",
                            galleryImages: [],
                            letterImage: "assets/images/letter_placeholder.jpg",
                            audioFile: "assets/audio/jai/Jai_voice_note.ogg",
                            skipPuzzle: true,
                            audioFocus: true,
                            transcription: "Voice note from Jai.",
                            hideAudio: true,
                            hideWhatsapp: true,
                            phoneNumber: ""
                        },
                        {
                            id: 15,
                            name: "Chitti",
                            thumbnailImage: "assets/images/thumbnail/thumbnail_chitti.jpg",
                            puzzleImage: "assets/images/chitti/chitti_puzzle.jpg",
                            solvedImage: "assets/images/chitti/chitti_puzzle.jpg",
                            galleryImages: [],
                            letterPdf: "assets/images/chitti/chitti.pdf",
                            letterImage: "assets/images/letter_placeholder.jpg",
                            audioFile: "assets/audio/placeholder_message.mp3",
                            hideAudio: true,
                            hideWhatsapp: true,
                            phoneNumber: ""
                        },
                        {
                            id: 16,
                            name: "Chittapa",
                            thumbnailImage: "assets/images/thumbnail/thumbnail_chittapa.jpg",
                            puzzleImage: "assets/images/chittapa/chittapa_puzzle.jpg",
                            solvedImage: "assets/images/chittapa/chittapa_puzzle.jpg",
                            galleryImages: [],
                            letterImage: "assets/images/chittapa/chittapa_letter.jpg",
                            audioFile: "assets/audio/placeholder_message.mp3",
                            hideAudio: true,
                            hideWhatsapp: true,
                            phoneNumber: ""
                        },
                        {
                            id: 17,
                            name: "Sanju",
                            thumbnailImage: "assets/images/thumbnail/thumbnail_sanju.jpg",
                            puzzleImage: "assets/images/sanju/sanju1.jpg",
                            solvedImage: "assets/images/sanju/sanju1.jpg",
                            galleryImages: [],
                            letterImage: "assets/images/sanju/sanju2.jpg",
                            audioFile: "assets/audio/placeholder_message.mp3",
                            skipPuzzle: true,
                            hideAudio: true,
                            hideWhatsapp: true,
                            phoneNumber: ""
                        }
                    ],
                    mapImage: "assets/images/map_placeholder.jpg"
                },
                {
                    id: 18,
                    name: "Bangalore",
                    lat: 12.9716,
                    lng: 77.5946,
                    people: [

                        {
                            id: 19,
                            name: "Reshwin",
                            thumbnailImage: "assets/images/thumbnail/thumbnail_reshwin.jpg",
                            puzzleImage: "assets/audio/reshwin/reshwin_puzzle.jpg",
                            solvedImage: "assets/audio/reshwin/reshwin_puzzle.jpg",
                            galleryImages: [],
                            letterImage: "assets/images/letter_placeholder.jpg",
                            audioFile: "assets/audio/reshwin/reshwin_audio_.ogg",
                            rightSideAudio: true,
                            transcription: "Voice note from Reshwin.",
                            hideAudio: true,
                            hideWhatsapp: true,
                            phoneNumber: ""
                        }
                    ],
                    mapImage: "assets/images/map_placeholder.jpg"
                },
                {
                    id: 20,
                    name: "Itanagar",
                    lat: 27.0844,
                    lng: 93.6053,
                    people: [
                        {
                            id: 20,
                            name: "Siddarth",
                            thumbnailImage: "assets/images/thumbnail/thumbnail_siddu.jpg",
                            puzzleImage: "assets/images/sidharth/sidharth_puzzle.jpg",
                            solvedImage: "assets/images/sidharth/sidharth_puzzle.jpg",
                            galleryImages: [],
                            letterPdf: "assets/images/sidharth/sidharth.pdf",
                            letterImage: "assets/images/letter_placeholder.jpg",
                            audioFile: "assets/audio/placeholder_message.mp3",
                            hideAudio: true,
                            hideWhatsapp: true,
                            phoneNumber: ""
                        }
                    ],
                    mapImage: "assets/images/map_placeholder.jpg"
                },

                {
                    id: 21,
                    name: "Vijayawada",
                    lat: 16.5062,
                    lng: 80.6480,
                    people: [
                        {
                            id: 21,
                            name: "Nishant",
                            thumbnailImage: "assets/images/placeholder_thumb.jpg",
                            puzzleImage: "assets/images/placeholder_puzzle.jpg",
                            solvedImage: "assets/images/placeholder_solved.jpg",
                            galleryImages: [],
                            letterImage: "assets/images/letter_placeholder.jpg",
                            audioFile: "assets/audio/nishanth/Nishanth.oga",
                            skipPuzzle: true,
                            audioFocus: true,
                            transcription: "Voice note from Nishant.",
                            hideAudio: true,
                            hideWhatsapp: true,
                            phoneNumber: ""
                        }
                    ],
                    mapImage: "assets/images/map_placeholder.jpg"
                }

            ]
        },
        {
            id: "uae",
            name: "UAE",
            lat: 23.4241,
            lng: 53.8478,
            mapImage: "assets/images/map_placeholder.jpg",
            cities: [
                {
                    id: 10,
                    name: "Abu Dhabi",
                    lat: 24.4539,
                    lng: 54.3773,
                    people: [
                        {
                            id: 10,
                            name: "Chhavi",
                            thumbnailImage: "assets/images/thumbnail/thumbnail_chhavi.jpg",
                            puzzleImage: "assets/images/chhavi/chhavi_puzzle.jpg",
                            solvedImage: "assets/images/chhavi/chhavi_puzzle.jpg",
                            galleryImages: [],
                            letterPdf: "assets/images/chhavi/Chhavi.pdf",
                            letterImage: "assets/images/letter_placeholder.jpg",
                            audioFile: "assets/audio/placeholder_message.mp3",
                            hideAudio: true,
                            hideWhatsapp: true,
                            phoneNumber: ""
                        }
                    ],
                    mapImage: "assets/images/map_placeholder.jpg"
                }
            ]
        }
    ]
};

// Make it globally accessible
window.database = database;
