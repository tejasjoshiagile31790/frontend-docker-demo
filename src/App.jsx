import './App.css';
import { useEffect, useState } from 'react';

const emptyForm = { name: '', email: '', age: '', city: '' };

export function App() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [formData, setFormData] = useState(emptyForm);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/users');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setModalMode('add');
    setFormData(emptyForm);
    setSelectedUserId(null);
    setFormError('');
    setModalVisible(true);
  };

  const handleOpenEditModal = (user) => {
    setModalMode('edit');
    setFormData({
      name: user.name,
      email: user.email,
      age: user.age?.toString() ?? '',
      city: user.city ?? '',
    });
    setSelectedUserId(user._id);
    setFormError('');
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setFormError('');
  };

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      handleCloseModal();
    }
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    const payload = {
      name: formData.name,
      email: formData.email,
      age: parseInt(formData.age, 10),
      city: formData.city,
    };

    try {
      if (modalMode === 'add') {
        const response = await fetch(import.meta.env.VITE_API_URL + '/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setUsers((prev) => [...prev, data.user]);
        handleCloseModal();
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/users/${selectedUserId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setUsers((prev) =>
        prev.map((user) => (user._id === data.user._id ? data.user : user))
      );
      handleCloseModal();
    } catch (err) {
      setFormError(err.message);
      console.error('Submit error:', err);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/users/${userId}`,
        { method: 'DELETE' }
      );
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      setUsers((prev) => prev.filter((user) => user._id !== userId));
    } catch (err) {
      setDeleteError(err.message);
      console.error('Delete error:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEditClick = (event) => {
    const userId = event.currentTarget.dataset.userId;
    const user = users.find((item) => item._id === userId);
    if (user) handleOpenEditModal(user);
  };

  const handleDeleteClick = (event) => {
    handleDelete(event.currentTarget.dataset.userId);
  };

  if (loading) {
    return (
      <div className="app-shell">
        <div className="state-screen">
          <div className="spinner" aria-hidden="true" />
          <h2>Loading roster</h2>
          <p>Pulling people from MongoDB…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-shell">
        <div className="state-screen">
          <h2>Couldn’t load users</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="app-frame">
        <header className="topbar">
          <div className="brand-block">
            <h1 className="brand">
              Rost<span>er</span>
            </h1>
            <p className="tagline">
              A cleaner way to manage people — add, edit, and keep your list in sync.
            </p>
          </div>
          <div className="toolbar">
            <div className="count-chip">
              <strong>{users.length}</strong>
              {users.length === 1 ? 'person' : 'people'}
            </div>
            <button type="button" className="btn btn-primary" onClick={handleOpenAddModal}>
              Add user
            </button>
          </div>
        </header>

        {deleteLoading && (
          <div className="status-banner info">Deleting user…</div>
        )}
        {deleteError && (
          <div className="status-banner error">Delete error: {deleteError}</div>
        )}

        {users.length === 0 ? (
          <div className="state-screen">
            <h2>No one here yet</h2>
            <p>Add your first user to start the roster.</p>
            <button
              type="button"
              className="btn btn-primary empty-cta"
              onClick={handleOpenAddModal}
            >
              Add user
            </button>
          </div>
        ) : (
          <section className="panel">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Age</th>
                    <th>City</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td>
                        <div className="user-name">{user.name}</div>
                        <div className="id-cell" title={user._id}>
                          {user._id}
                        </div>
                      </td>
                      <td className="user-email">{user.email}</td>
                      <td>{user.age}</td>
                      <td>
                        <span
                          className={`city-pill${user.city ? '' : ' empty'}`}
                        >
                          {user.city || 'No city'}
                        </span>
                      </td>
                      <td>
                        <div className="actions">
                          <button
                            type="button"
                            className="btn btn-soft btn-sm"
                            data-user-id={user._id}
                            onClick={handleEditClick}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            data-user-id={user._id}
                            onClick={handleDeleteClick}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>

      {modalVisible && (
        <div className="modal-backdrop" onClick={handleBackdropClick}>
          <div className="modal-content" role="dialog" aria-modal="true">
            <h2>{modalMode === 'add' ? 'Add user' : 'Edit user'}</h2>
            <p className="modal-subtitle">
              {modalMode === 'add'
                ? 'Create a new entry in your roster.'
                : 'Update this person’s details.'}
            </p>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="name">Name</label>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Jane Smith"
                  />
                </div>
                <div className="field">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="jane@example.com"
                  />
                </div>
                <div className="field">
                  <label htmlFor="age">Age</label>
                  <input
                    id="age"
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    required
                    min="0"
                    placeholder="28"
                  />
                </div>
                <div className="field">
                  <label htmlFor="city">City</label>
                  <input
                    id="city"
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    placeholder="Austin"
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={handleCloseModal}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {modalMode === 'add' ? 'Add user' : 'Save changes'}
                </button>
              </div>
              {formError && (
                <div className="status-banner error form-error">
                  {formError}
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
