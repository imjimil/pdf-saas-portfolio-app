import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Navigation from '../components/Navigation';
import { authAPI, fileAPI } from '../services/api';
import { useFormik } from 'formik';
import * as Yup from 'yup';

interface User {
  _id: string;
  email: string;
  name?: string;
  createdAt: string;
  googleId?: string;
}

const Profile = () => {
  const { isAuthenticated, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalSize: 0,
    thisMonth: 0,
  });

  useEffect(() => {
    // Wait for auth to finish loading before checking
    if (authLoading) {
      return;
    }
    
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchProfile();
    fetchStats();
  }, [isAuthenticated, authLoading, navigate]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getProfile();
      setUser(response.user);
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fileAPI.getHistory(1, 1);
      const totalFiles = response.pagination.total;
      
      // Get all files to calculate total size
      const allFilesResponse = await fileAPI.getHistory(1, totalFiles || 1000);
      let totalSize = 0;
      let thisMonthCount = 0;
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      allFilesResponse.files.forEach((file: any) => {
        totalSize += file.fileSize;
        const fileDate = new Date(file.createdAt);
        if (fileDate >= startOfMonth) {
          thisMonthCount++;
        }
      });

      setStats({
        totalFiles,
        totalSize,
        thisMonth: thisMonthCount,
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const profileFormik = useFormik({
    initialValues: {
      name: user?.name || '',
    },
    enableReinitialize: true,
    validationSchema: Yup.object({
      name: Yup.string().max(100, 'Name must be less than 100 characters'),
    }),
    onSubmit: async (values) => {
      try {
        setError('');
        setSuccess('');
        await authAPI.updateProfile(values.name);
        setSuccess('Profile updated successfully');
        await fetchProfile();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to update profile');
      }
    },
  });

  const passwordFormik = useFormik({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validationSchema: Yup.object({
      currentPassword: Yup.string().required('Current password is required'),
      newPassword: Yup.string()
        .min(6, 'Password must be at least 6 characters')
        .required('New password is required'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('newPassword')], 'Passwords must match')
        .required('Please confirm your password'),
    }),
    onSubmit: async (values) => {
      try {
        setError('');
        setSuccess('');
        await authAPI.changePassword(values.currentPassword, values.newPassword);
        setSuccess('Password changed successfully');
        passwordFormik.resetForm();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to change password');
      }
    },
  });

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone and will delete all your files and data.')) {
      return;
    }

    if (!window.confirm('This is your last chance. Are you absolutely sure?')) {
      return;
    }

    try {
      await authAPI.deleteAccount();
      logout();
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete account');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen bg-cream-light dark:bg-gray-900 transition-colors">
        <Navigation showAuth={true} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-primary"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-light dark:bg-gray-900 transition-colors">
        <Navigation showAuth={true} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-primary"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-light dark:bg-gray-900 transition-colors">
      <Navigation showAuth={true} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6 md:mb-8">
          Profile Settings
        </h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-800 dark:text-green-200">
            {success}
          </div>
        )}

        {/* Usage Statistics */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Usage Statistics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Files Processed</div>
              <div className="text-2xl font-bold text-green-primary dark:text-green-light">
                {stats.totalFiles}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Storage Used</div>
              <div className="text-2xl font-bold text-green-primary dark:text-green-light">
                {formatFileSize(stats.totalSize)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Files This Month</div>
              <div className="text-2xl font-bold text-green-primary dark:text-green-light">
                {stats.thisMonth}
              </div>
            </div>
          </div>
        </div>

        {/* Account Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Account Information
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Email cannot be changed</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Account Created
              </label>
              <input
                type="text"
                value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''}
                disabled
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed"
              />
            </div>
            {user?.googleId && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  This account was created with Google OAuth
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Update Profile */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Update Profile
          </h2>
          <form onSubmit={profileFormik.handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Name
              </label>
              <input
                type="text"
                name="name"
                value={profileFormik.values.name}
                onChange={profileFormik.handleChange}
                onBlur={profileFormik.handleBlur}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              {profileFormik.touched.name && profileFormik.errors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {profileFormik.errors.name}
                </p>
              )}
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-green-primary dark:bg-green-dark text-white rounded-lg hover:bg-green-dark dark:hover:bg-green-primary transition"
            >
              Update Profile
            </button>
          </form>
        </div>

        {/* Change Password */}
        {!user?.googleId && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Change Password
            </h2>
            <form onSubmit={passwordFormik.handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordFormik.values.currentPassword}
                  onChange={passwordFormik.handleChange}
                  onBlur={passwordFormik.handleBlur}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                {passwordFormik.touched.currentPassword && passwordFormik.errors.currentPassword && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {passwordFormik.errors.currentPassword}
                  </p>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordFormik.values.newPassword}
                  onChange={passwordFormik.handleChange}
                  onBlur={passwordFormik.handleBlur}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                {passwordFormik.touched.newPassword && passwordFormik.errors.newPassword && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {passwordFormik.errors.newPassword}
                  </p>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordFormik.values.confirmPassword}
                  onChange={passwordFormik.handleChange}
                  onBlur={passwordFormik.handleBlur}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                {passwordFormik.touched.confirmPassword && passwordFormik.errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {passwordFormik.errors.confirmPassword}
                  </p>
                )}
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-green-primary dark:bg-green-dark text-white rounded-lg hover:bg-green-dark dark:hover:bg-green-primary transition"
              >
                Change Password
              </button>
            </form>
          </div>
        )}

        {/* Delete Account */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-red-200 dark:border-red-800">
          <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-4">
            Danger Zone
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <button
            onClick={handleDeleteAccount}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;

