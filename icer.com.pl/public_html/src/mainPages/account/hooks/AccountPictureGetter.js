import { useEffect, useState } from 'react';

export const useAccountPictureGetter = (defaultProfile, profilePicture) => {
    const [image, setImage] = useState('');

    useEffect(() => {
        if (defaultProfile === 1) {
            setImage(`${process.env.PUBLIC_URL}/data/userProfilePicture/face.jpg`);
        } else if (profilePicture) {
            import(`../../../data/userProfilePicture/${profilePicture}`)
                .then((image) => {
                    setImage(image.default);
                })
                .catch((error) => {
                    console.error(`Error loading image: ${error}`);
                    setImage(`${process.env.PUBLIC_URL}/data/userProfilePicture/face.jpg`);
                });
        } else {
            setImage(`${process.env.PUBLIC_URL}/data/userProfilePicture/face.jpg`);
        }
    }, [defaultProfile, profilePicture]);

    return image;
};
