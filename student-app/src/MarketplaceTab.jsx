
import { useEffect, useState } from 'react';

function MarketplaceItemPhoto({ listingId, userToken }) {
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    let objectUrl = '';

    const loadPhoto = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/marketplace/${listingId}/photo`,
          {
            headers: {
              Authorization: `Bearer ${userToken}`
            },
            signal: controller.signal
          }
        );

        if (!response.ok) {
          throw new Error('Could not load item photo.');
        }

        const blob = await response.blob();

        if (controller.signal.aborted) return;

        objectUrl = URL.createObjectURL(blob);
        setImageUrl(objectUrl);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error('Marketplace photo error:', error);
        }
      }
    };

    loadPhoto();

    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [listingId, userToken]);

  if (!imageUrl) return null;

  return (
    <img
      src={imageUrl}
      alt="Marketplace item"

style={{
  width: '100%',
  height: '250px',
  objectFit: 'contain',
  backgroundColor: '#f8f9fa',
  borderRadius: '10px',
  marginBottom: '16px'
}}

    />
  );
}

export default function MarketplaceTab({ userToken }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

const [showPostForm, setShowPostForm] = useState(false);
const [posting, setPosting] = useState(false);
const [postMessage, setPostMessage] = useState('');
const [refreshKey, setRefreshKey] = useState(0);
const [showMyListings, setShowMyListings] = useState(false);
const [searchTerm, setSearchTerm] = useState('');
const [selectedCategory, setSelectedCategory] = useState('All');
const [sortOrder, setSortOrder] = useState('newest');
const [editingId, setEditingId] = useState(null);
const [savingId, setSavingId] = useState(null);


  useEffect(() => {
    const controller = new AbortController();

    const loadListings = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(
          `http://localhost:5000/api/marketplace${showMyListings ? '/mine' : ''}`,
          {
            headers: {
              Authorization: `Bearer ${userToken}`
            },
            signal: controller.signal
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || 'Could not load marketplace items.'
          );
        }

        if (!Array.isArray(data.listings)) {
          throw new Error('Invalid marketplace response.');
        }

        setListings(data.listings);
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    if (userToken) {
      loadListings();
    } else {
      setLoading(false);
      setError('Please sign in to view marketplace items.');
    }

    return () => controller.abort();
}, [userToken, refreshKey, showMyListings]);

  return (
    <div className="dashboard-content marketplace-page">
      <section className="dashboard-card">

<div className="marketplace-hero">
  <span className="marketplace-hero-kicker">
    🛍️ GJU STUDENT MARKETPLACE
  </span>

  <h1>Student Marketplace</h1>

  <p>
    Buy, sell, or give away useful university items
    with other GJU students.
  </p>
</div>


<button
  type="button"
  className="post-item-button marketplace-nav-button"
  style={{ marginRight: '12px', marginBottom: '12px' }}
  onClick={() => {
    setShowMyListings((current) => !current);
    setPostMessage('');
  }}
>
  {showMyListings ? '← All Items' : 'My Listings'}
</button>

<button
  type="button"
  className="post-item-button marketplace-create-button"

style={{
  display: 'inline-block',
  width: 'auto',
  minWidth: '140px',
  padding: '11px 16px',
  backgroundColor: '#1f6fb2',
  color: 'white',
  border: 'none',
  borderRadius: '10px'
}}

  onClick={() => {
    setShowPostForm(!showPostForm);
    setPostMessage('');
  }}
>
  {showPostForm ? 'Cancel' : '+ Post an Item'}
</button>


{postMessage && (
  <p role="status" className="marketplace-feedback">
    {postMessage}
  </p>
)}


{showPostForm && (
  <form
    className="auth-form"
    style={{ marginTop: '20px', marginBottom: '24px' }}
    onSubmit={async (event) => {
      event.preventDefault();

      const form = event.currentTarget;
      const data = new FormData(form);

      const item = {
        title: data.get('title'),
        description: data.get('description'),
        category: data.get('category'),
        listing_type: data.get('listing_type'),
        price: data.get('price'),
        item_condition: data.get('item_condition')
      };

      setPosting(true);
      setPostMessage('');

      try {
        const response = await fetch(
          'http://localhost:5000/api/marketplace',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${userToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(item)
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error || 'Could not post item.'
          );
        }

const photo = data.get('photo');

if (photo instanceof File && photo.size > 0) {
  const photoData = new FormData();
  photoData.append('photo', photo);

  const photoResponse = await fetch(
    `http://localhost:5000/api/marketplace/${result.listing_id}/photo`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${userToken}`
      },
      body: photoData
    }
  );

  if (!photoResponse.ok) {
    const photoError = await photoResponse.json();

    setPostMessage(
      `Item posted, but photo upload failed: ${
        photoError.error || 'Unknown error'
      }`
    );

    setShowPostForm(false);
    setRefreshKey((current) => current + 1);
    return;
  }
}


        setPostMessage('Item posted successfully!');
        setShowPostForm(false);
        setRefreshKey((current) => current + 1);

      } catch (error) {
        setPostMessage(error.message);
      } finally {
        setPosting(false);
      }
    }}
  >
    <h3>Post a New Item</h3>

    <label className="field">
      <span>Item Title</span>
      <input
        name="title"
        placeholder="e.g. Calculator"
        maxLength={150}
        required
      />
    </label>

    <label className="field">
      <span>Description</span>
      <textarea
        name="description"
        placeholder="Describe your item"
        rows={3}
        required
      />
    </label>

    <label className="field">
      <span>Category</span>
      <select name="category" required>
        <option value="Books">Books</option>
        <option value="Lab Coats">Lab Coats</option>
        <option value="Calculators">Calculators</option>
        <option value="Study Supplies">Study Supplies</option>
        <option value="Other">Other</option>
      </select>
    </label>

    <label className="field">
      <span>Listing Type</span>
      <select name="listing_type" required>
        <option value="Sell">Sell</option>
        <option value="Give Away">Give Away</option>
      </select>
    </label>

    <label className="field">
      <span>Price (JD) — for selling only</span>
      <input
        type="number"
        name="price"
        min="0.01"
        step="0.01"
        placeholder="e.g. 10"
      />
    </label>

    <label className="field">
      <span>Item Condition</span>
      <select name="item_condition" required>
        <option value="New">New</option>
        <option value="Like New">Like New</option>
        <option value="Good">Good</option>
        <option value="Fair">Fair</option>
      </select>
    </label>


<label className="field">
  <span>Item Photo (optional)</span>
  <input
    type="file"
    name="photo"
    accept="image/jpeg,image/png,image/webp"
  />
  <small>JPG, PNG or WEBP — maximum 5MB</small>
</label>



    <button
      type="submit"
      className="post-item-button"
      disabled={posting}
    >
      {posting ? 'Posting...' : 'Publish Item'}
    </button>
  </form>
)}

<div className="marketplace-filters">
<div style={{ marginTop: '24px', marginBottom: '16px' }}>
  <label className="field">
    <span>Search Marketplace Items</span>
    <input
      type="text"
      placeholder="Search for books, calculators, lab coats..."
      value={searchTerm}
      onChange={(event) => setSearchTerm(event.target.value)}
    />
  </label>
</div>

<div style={{ marginBottom: '20px' }}>
  <label className="field">
    <span>Filter by Category</span>

    <select
      value={selectedCategory}
      onChange={(event) =>
        setSelectedCategory(event.target.value)
      }
    >
      <option value="All">All Categories</option>
      <option value="Books">Books</option>
      <option value="Lab Coats">Lab Coats</option>
      <option value="Calculators">Calculators</option>
      <option value="Study Supplies">Study Supplies</option>
      <option value="Other">Other</option>
    </select>
  </label>
</div>

<div style={{ marginBottom: '20px' }}>
  <label className="field">
    <span>Sort Items By</span>

    <select
      value={sortOrder}
      onChange={(event) => setSortOrder(event.target.value)}
    >
      <option value="newest">Newest First</option>
      <option value="oldest">Oldest First</option>
      <option value="priceLow">Price: Low to High</option>
      <option value="priceHigh">Price: High to Low</option>
    </select>
  </label>
</div>
</div>
        {loading && <p>Loading items...</p>}

        {error && <p role="alert">{error}</p>}

        {!loading && !error && listings.length === 0 && (
          <p>No items available yet.</p>
        )}

{!loading &&
  !error &&
  listings.length > 0 &&
  !listings.some((item) => {
    const search = searchTerm.trim().toLowerCase();

    const matchesSearch =
      item.title.toLowerCase().includes(search) ||
      item.description.toLowerCase().includes(search) ||
      item.category.toLowerCase().includes(search);

    const matchesCategory =
      selectedCategory === 'All' ||
      item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  }) && (
    <div
      style={{
        textAlign: 'center',
        padding: '35px 20px',
        backgroundColor: '#f8fafc',
        borderRadius: '12px',
        marginTop: '20px'
      }}
    >
      <div style={{ fontSize: '42px' }}>🔎</div>

      <h3 style={{ color: '#173b5e' }}>
        No matching items found
      </h3>

      <p style={{ color: '#64748b' }}>
        Try a different search or category.
      </p>

      <button
        type="button"
        className="post-item-button"
        onClick={() => {
          setSearchTerm('');
          setSelectedCategory('All');
        }}
      >
        Clear Filters
      </button>
    </div>
  )}


{!loading && !error && (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '24px',
      marginBottom: '12px',
      gap: '12px',
      flexWrap: 'wrap'
    }}
  >
    <h3 style={{ color: '#173b5e', margin: 0 }}>
     {showMyListings ? 'My Listings' : 'Available Items'}
    </h3>

    <span
      style={{
        color: '#64748b',
        fontSize: '14px',
        fontWeight: '600'
      }}
    >
      {listings.filter((item) => {
        const search = searchTerm.trim().toLowerCase();

        const matchesSearch =
          item.title.toLowerCase().includes(search) ||
          item.description.toLowerCase().includes(search) ||
          item.category.toLowerCase().includes(search);

        const matchesCategory =
          selectedCategory === 'All' ||
          item.category === selectedCategory;

        return matchesSearch && matchesCategory;
      }).length} Items Found
    </span>
  </div>
)}

        <div style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginTop: '24px'
        }}>

{listings


.filter((item) => {
  const search = searchTerm.trim().toLowerCase();

  const matchesSearch =
    item.title.toLowerCase().includes(search) ||
    item.description.toLowerCase().includes(search) ||
    item.category.toLowerCase().includes(search);

  const matchesCategory =
    selectedCategory === 'All' ||
    item.category === selectedCategory;

  return matchesSearch && matchesCategory;
})


.sort((a, b) => {
  if (sortOrder === 'priceLow') {
    return Number(a.price || 0) - Number(b.price || 0);
  }

  if (sortOrder === 'priceHigh') {
    return Number(b.price || 0) - Number(a.price || 0);
  }

  if (sortOrder === 'oldest') {
    return a.id - b.id;
  }

  return b.id - a.id;
})

  .map((item) => (

            <article key={item.id} className="marketplace-item-card">



{item.photo_path ? (
  <MarketplaceItemPhoto
    listingId={item.id}
    userToken={userToken}
  />
) : (
  <div
    style={{
      width: '100%',
      height: '250px',
      backgroundColor: '#f1f5f9',
      borderRadius: '10px',
      marginBottom: '16px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px'
    }}
  >
    <span style={{ fontSize: '48px' }}>📦</span>

    <span
      style={{
        color: '#64748b',
        fontSize: '14px',
        fontWeight: '500'
      }}
    >
      No photo available
    </span>
  </div>
)}


              <h3>{item.title}</h3>

              <p>{item.description}</p>


<div
  style={{
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    margin: '16px 0'
  }}
>
  <span
    style={{
      backgroundColor: '#e8f1fb',
      color: '#194f80',
      padding: '7px 12px',
      borderRadius: '20px',
      fontSize: '13px',
      fontWeight: '600'
    }}
  >
    {item.category}
  </span>

  <span
    style={{
      backgroundColor: '#f1f5f9',
      color: '#475569',
      padding: '7px 12px',
      borderRadius: '20px',
      fontSize: '13px',
      fontWeight: '600'
    }}
  >
    {item.item_condition}
  </span>
</div>

<div
  style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '10px',
    marginBottom: '18px'
  }}
>
  <strong
    style={{
      fontSize: '22px',
      color: '#123b63'
    }}
  >
    {item.listing_type === 'Give Away'
      ? 'Free'
      : `${Number(item.price).toFixed(2)} JD`}
  </strong>

  <span
    style={{
      color:
        item.status === 'Available'
          ? '#15803d'
          : item.status === 'Sold'
          ? '#b45309'
          : '#64748b',
      fontSize: '13px',
      fontWeight: '700'
    }}
  >
    ● {item.status}
  </span>
</div>


{showMyListings && (
  <label
    className="field"
    style={{ marginTop: '12px', marginBottom: '12px' }}
  >
    <span>Change Item Status</span>

    <select
      value={item.status}
      onChange={async (event) => {
        const newStatus = event.target.value;

        try {
          const response = await fetch(
            `http://localhost:5000/api/marketplace/${item.id}/status`,
            {
              method: 'PUT',
              headers: {
                Authorization: `Bearer ${userToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                status: newStatus
              })
            }
          );

          const result = await response.json();

          if (!response.ok) {
            throw new Error(
              result.error || 'Could not update item status.'
            );
          }

          setListings((current) =>
            current.map((listing) =>
              listing.id === item.id
                ? { ...listing, status: newStatus }
                : listing
            )
          );

          setRefreshKey((current) => current + 1);

        } catch (error) {
          window.alert(error.message);
        }
      }}
    >
      <option value="Available">Available</option>
      <option value="Sold">Sold</option>
      <option value="Unavailable">Unavailable</option>
    </select>
  </label>
)}

{showMyListings && (

<div
  style={{
    display: editingId === item.id ? 'block' : 'inline-block',
    verticalAlign: 'top',
    marginTop: '12px',
    marginRight: '10px',
    marginBottom: '12px'
  }}
>

    <button
      type="button"
      className="post-item-button"
      onClick={() =>
        setEditingId(editingId === item.id ? null : item.id)
      }
    >
      {editingId === item.id ? 'Cancel Edit' : 'Edit Listing'}
    </button>

    {editingId === item.id && (
      <form
        className="auth-form"
        style={{ marginTop: '16px' }}
        onSubmit={async (event) => {
          event.preventDefault();

          const data = new FormData(event.currentTarget);

          const updatedItem = {
            title: data.get('title'),
            description: data.get('description'),
            category: data.get('category'),
            listing_type: data.get('listing_type'),
            price: data.get('price'),
            item_condition: data.get('item_condition')
          };

          setSavingId(item.id);

          try {
            const response = await fetch(
              `http://localhost:5000/api/marketplace/${item.id}`,
              {
                method: 'PUT',
                headers: {
                  Authorization: `Bearer ${userToken}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedItem)
              }
            );

            const result = await response.json();

            if (!response.ok) {
              throw new Error(
                result.error || 'Could not update listing.'
              );
            }

            setEditingId(null);
            setRefreshKey((current) => current + 1);
            window.alert('Listing updated successfully!');

          } catch (error) {
            window.alert(error.message);
          } finally {
            setSavingId(null);
          }
        }}
      >
        <h3>Edit Your Item</h3>

        <label className="field">
          <span>Title</span>
          <input
            name="title"
            defaultValue={item.title}
            maxLength={150}
            required
          />
        </label>

        <label className="field">
          <span>Description</span>
          <textarea
            name="description"
            defaultValue={item.description}
            maxLength={5000}
            rows={3}
            required
          />
        </label>

        <label className="field">
          <span>Category</span>
          <select name="category" defaultValue={item.category}>
            {[
              'Books',
              'Lab Coats',
              'Calculators',
              'Study Supplies',
              'Other'
            ].map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Listing Type</span>
          <select
            name="listing_type"
            defaultValue={item.listing_type}
          >
            <option value="Sell">Sell</option>
            <option value="Give Away">Give Away</option>
          </select>
        </label>

        <label className="field">
          <span>Price (JD) — for selling only</span>
          <input
            type="number"
            name="price"
            min="0.01"
            step="0.01"
            defaultValue={item.price ?? ''}
          />
        </label>

        <label className="field">
          <span>Condition</span>
          <select
            name="item_condition"
            defaultValue={item.item_condition}
          >
            <option value="New">New</option>
            <option value="Like New">Like New</option>
            <option value="Good">Good</option>
            <option value="Fair">Fair</option>
          </select>
        </label>

        <button
          type="submit"
          className="post-item-button"
          disabled={savingId === item.id}
        >
          {savingId === item.id
            ? 'Saving...'
            : 'Save Changes'}
        </button>
      </form>
    )}
  </div>
)}

{showMyListings && (
  <button
    type="button"
    className="post-item-button"

style={{
  display: 'inline-block',
  width: 'auto',
  minWidth: '140px',
  padding: '11px 16px',
  backgroundColor: '#dc3545',
  color: 'white',
  border: 'none',
  borderRadius: '10px',
  marginTop: '12px',
  marginBottom: '12px',
  verticalAlign: 'top'
}}

    onClick={async () => {
      const confirmed = window.confirm(
        `Are you sure you want to permanently delete "${item.title}"?`
      );

      if (!confirmed) return;

      try {
        const response = await fetch(
          `http://localhost:5000/api/marketplace/${item.id}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${userToken}`
            }
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error || 'Could not delete listing.'
          );
        }

        setListings((current) =>
          current.filter((listing) => listing.id !== item.id)
        );

        setEditingId(null);
        setRefreshKey((current) => current + 1);

        window.alert(result.message || 'Listing deleted successfully!');

      } catch (error) {
        window.alert(error.message || 'Could not delete listing.');
      }
    }}
  >
    Delete Listing
  </button>
)}



{!showMyListings && item.seller_email && (
  <a
    href={`https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(item.seller_email)}&subject=${encodeURIComponent(`UniMate Marketplace - ${item.title}`)}`}
    target="_blank"
    rel="noopener noreferrer"
    style={{
      display: 'block',
      backgroundColor: '#1f6fb2',
      color: '#ffffff',
      padding: '12px 18px',
      borderRadius: '10px',
      textAlign: 'center',
      textDecoration: 'none',
      fontWeight: '600',
      marginTop: '16px'
    }}
  >
    ✉ Contact Seller
  </a>
)}


            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
