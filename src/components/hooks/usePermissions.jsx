import { useState, useEffect } from 'react';
import { User } from '@/api/entities';

export default function usePermissions() {
    const [permissions, setPermissions] = useState({
        isLoggedIn: false,
        isAdmin: false,
        canEdit: false,
        isLoading: true,
        user: null,
    });

    useEffect(() => {
        const checkUser = async () => {
            try {
                const currentUser = await User.me();
                if (currentUser) {
                    const isAdmin = currentUser.role === 'admin';
                    setPermissions({
                        isLoggedIn: true,
                        isAdmin: isAdmin,
                        canEdit: isAdmin, // For now, only admins can edit
                        isLoading: false,
                        user: currentUser,
                    });
                } else {
                     setPermissions({ isLoggedIn: false, isAdmin: false, canEdit: false, isLoading: false, user: null });
                }
            } catch (error) {
                // User is not logged in
                setPermissions({ isLoggedIn: false, isAdmin: false, canEdit: false, isLoading: false, user: null });
            }
        };

        checkUser();
    }, []);

    return permissions;
}