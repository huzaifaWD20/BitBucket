import React, { useState, useEffect, useRef } from 'react';
import { Loader, Download } from 'lucide-react';
import './App.css';

export default function App() {
  const [tweetUrl, setTweetUrl] = useState('');
  const [preview, setPreview] = useState(null);
  const [selectedColor, setSelectedColor] = useState('white');
  const [selectedSize, setSelectedSize] = useState('M');
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const canvasRef = useRef(null);
  const fabricRef = useRef(null);
  const [fabricLoaded, setFabricLoaded] = useState(false);
  const [mockupImage, setMockupImage] = useState(null);
  const [printFile, setPrintFile] = useState(null);  // ADD THIS


  const colors = {
    white: { name: 'White', image: '/white-tshirt.jpg', hex: '#FFFFFF' },
    black: { name: 'Black', image: '/white-tshirt.jpg', hex: '#1F2937' },
    navy: { name: 'Navy Blue', image: '/white-tshirt.jpg', hex: '#001F3F' },
    red: { name: 'Red', image: '/white-tshirt.jpg', hex: '#DC2626' },
    green: { name: 'Green', image: '/white-tshirt.jpg', hex: '#16A34A' },
  };

  const sizes = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];

  // Load Fabric.js
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.0/fabric.min.js';
    script.onload = () => {
      setFabricLoaded(true);
    };
    document.body.appendChild(script);
  }, []);

  // Initialize canvas when fabric loads and preview changes
  useEffect(() => {
    if (fabricLoaded && preview && canvasRef.current) {
      initializeCanvas();
    }
  }, [fabricLoaded, preview, selectedColor]);

  const initializeCanvas = () => {
    if (fabricRef.current) {
      fabricRef.current.dispose();
    }

    const canvas = new window.fabric.Canvas('tshirtCanvas', {
      width: 500,
      height: 500,
      backgroundColor: '#f5f5f5',
    });

    fabricRef.current = canvas;

    // Load t-shirt image
    const imgUrl = colors[selectedColor].image;
    window.fabric.Image.fromURL(imgUrl, (img) => {
      img.set({
        left: 0,
        top: 0,
        selectable: false,
        evented: false,
      });
      img.scaleToWidth(500);
      canvas.add(img);
      canvas.sendToBack(img);

      // Add draggable tweet print directly on shirt
      addTweetPrintToShirt(canvas);
      canvas.renderAll();
    });
  };

  const addTweetPrintToShirt = (canvas) => {
    const textColor = selectedColor === 'white' ? '#000000' : '#FFFFFF';

    // Author name
    const author = new window.fabric.Text(preview.author, {
      left: 150,
      top: 200,
      fontSize: 16,
      fontWeight: 'bold',
      fill: textColor,
      fontFamily: 'Arial',
      selectable: true,
      evented: true,
    });
    canvas.add(author);

    // Handle
    const handle = new window.fabric.Text(preview.handle, {
      left: 150,
      top: 225,
      fontSize: 13,
      fill: textColor,
      fontFamily: 'Arial',
      opacity: 0.8,
      selectable: true,
      evented: true,
    });
    canvas.add(handle);

    // Tweet text (wrapped and draggable as group)
    const tweetText = new window.fabric.Textbox(preview.text, {
      left: 80,
      top: 260,
      width: 340,
      fontSize: 12,
      fill: textColor,
      fontFamily: 'Arial',
      lineHeight: 1.6,
      selectable: true,
      evented: true,
    });
    canvas.add(tweetText);

    // Timestamp
    const timestamp = new window.fabric.Text(preview.timestamp, {
      left: 150,
      top: 420,
      fontSize: 11,
      fill: textColor,
      fontFamily: 'Arial',
      opacity: 0.7,
      selectable: true,
      evented: true,
    });
    canvas.add(timestamp);

    // Create group for easier manipulation
    canvas.setActiveObject(tweetText);
    canvas.renderAll();
  };

  const extractTweetId = (url) => {
    const match = url.match(/\/status\/(\d+)/);
    return match ? match[1] : null;
  };

  // const handleGeneratePreview = async () => {
  //   if (!tweetUrl.trim()) {
  //     setError('Please enter a tweet URL');
  //     return;
  //   }

  //   setLoading(true);
  //   setError('');

  //   try {
  //     const tweetId = extractTweetId(tweetUrl);

  //     if (!tweetId) {
  //       setError('Invalid tweet URL. Please use format: https://x.com/username/status/1234567890');
  //       setLoading(false);
  //       return;
  //     }

  //     // Call backend API
  //     const response = await fetch('http://localhost:3001/api/tweet/preview', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({ url: tweetUrl }),
  //     });

  //     if (!response.ok) {
  //       throw new Error('Failed to fetch tweet');
  //     }

  //     const data = await response.json();

  //     if (data.error) {
  //       setError(`Backend Error: ${data.error}`);
  //       return;
  //     }

  //     if (!data.data) {
  //       setError('No tweet data received');
  //       return;
  //     }

  //     setPreview(data.data);
  //   } catch (err) {
  //     console.error('Frontend Error:', err);
  //     setError(`Error: ${err.message}`);
  //   }

  //   setLoading(false);
  // };

  const pollMockupStatus = async (taskKey) => {
    let tries = 0;
    while (tries < 15) {
      tries++;
      const res = await fetch(`http://localhost:3001/api/mockup/status/${taskKey}`);
      const data = await res.json();

      if (data.status === 'completed') {
        console.log('✅ Mockup ready:', data.mockups[0].url);
        setMockupImage(data.mockups[0].url);
        return;
      }
      if (data.status === 'failed') {
        setError('Mockup generation failed.');
        return;
      }

      await new Promise((r) => setTimeout(r, 3000)); // wait 3s before retry
    }

    setError('Timeout: Mockup took too long to generate.');
  };


  const handleGeneratePreview = async () => {
    if (!tweetUrl.trim()) {
      setError('Please enter a tweet URL');
      return;
    }

    setLoading(true);
    setError('');
    setMockupImage(null);

    try {
      const tweetId = extractTweetId(tweetUrl);
      if (!tweetId) {
        setError('Invalid tweet URL');
        setLoading(false);
        return;
      }

      // Step 1️⃣ - Fetch tweet data
      const tweetRes = await fetch('http://localhost:3001/api/tweet/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: tweetUrl }),
      });

      const tweetData = await tweetRes.json();
      if (!tweetData.success) throw new Error('Failed to fetch tweet data');

      // Step 2️⃣ - Generate mockup via backend
      const mockupRes = await fetch('http://localhost:3001/api/printful/mockup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tweetData: tweetData.data }),
      });

      const mockupData = await mockupRes.json();
      console.log('🖼️ Mockup Data:', mockupData);

      // ✅ If backend already polled and returned URLs:
      if (mockupData.success && mockupData.mockup_urls?.length) {
        setMockupImage(mockupData.mockup_urls[0]);   // Preview
        setPrintFile(mockupData.image_uploaded);     // High-res print file
      } 
      // ⚙️ If backend only started a task (polling fallback)
      else if (mockupData.mockup_task) {
        await pollMockupStatus(mockupData.mockup_task);
      }

      setPreview(tweetData.data);

    } catch (err) {
      console.error('❌ Error generating mockup:', err);
      setError(err.message);
    }

    setLoading(false);
  };

  
  const handleExportImage = () => {
    if (fabricRef.current) {
      const dataURL = fabricRef.current.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 2,
      });

      const link = document.createElement('a');
      link.href = dataURL;
      link.download = `tshirt-mockup-${selectedColor}-${selectedSize}.png`;
      link.click();
    }
  };

  const handleAddToCart = () => {
    setCart({
      author: preview.author,
      text: preview.text,
      color: colors[selectedColor].name,
      size: selectedSize,
      price: 29.99,
    });
    setTimeout(() => setCart(null), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-2">👕 Wear Your Tweet</h1>
          <p className="text-xl text-gray-600">Turn any real tweet into a custom t-shirt</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Input & Tweet Preview */}
          <div className="lg:col-span-1 space-y-6">
            {/* Input Section */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Step 1: Paste Tweet URL</h2>

              <input
                type="text"
                placeholder="https://x.com/username/status/1234567890"
                value={tweetUrl}
                onChange={(e) => setTweetUrl(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleGeneratePreview()}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none mb-3 text-gray-700"
              />

              <button
                onClick={handleGeneratePreview}
                disabled={!tweetUrl || loading}
                className={`w-full py-3 rounded-lg font-bold text-white transition flex items-center justify-center gap-2 ${
                  loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {loading && <Loader className="animate-spin" size={20} />}
                {loading ? 'Fetching Tweet...' : 'Generate Preview'}
              </button>

              {error && (
                <div className="mt-3 p-3 bg-red-50 border-2 border-red-300 rounded-lg">
                  <p className="text-red-700 font-semibold text-sm whitespace-pre-wrap">{error}</p>
                </div>
              )}
            </div>

            {/* Tweet Preview */}
            {preview && (
              <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-blue-200">
                <h3 className="text-lg font-bold mb-4 text-gray-900">Tweet Preview</h3>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="text-3xl">🤖</div>
                    <div className="flex-1">
                      <div className="font-bold text-gray-900 text-sm">{preview.author}</div>
                      <div className="text-gray-500 text-xs">{preview.handle}</div>
                    </div>
                  </div>

                  <p className="text-gray-900 mb-3 text-sm leading-relaxed break-words">{preview.text}</p>

                  <div className="text-gray-500 text-xs mb-3">{preview.timestamp}</div>
                </div>
              </div>
            )}
          </div>

          {/* Center: T-Shirt Canvas with Print 
          {preview && fabricLoaded && (
            <div className="lg:col-span-1 flex flex-col items-center justify-center">
              <h2 className="text-xl font-bold text-gray-900 mb-6 w-full text-center">T-Shirt Preview</h2>

              <div className="bg-white rounded-lg shadow-2xl p-4 border border-gray-200">
                <canvas
                  id="tshirtCanvas"
                  ref={canvasRef}
                  className="border-2 border-gray-300 rounded-lg"
                  style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
                />
              </div>

              <button
                onClick={handleExportImage}
                className="mt-4 px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition flex items-center gap-2"
              >
                <Download size={18} />
                Export Mockup
              </button>

              <div className="text-center mt-4 text-sm text-gray-600">
                <p>
                  <strong>{colors[selectedColor].name}</strong> T-Shirt • Size <strong>{selectedSize}</strong>
                </p>
                <p className="text-xs text-gray-500 mt-1">📌 Drag & position text on shirt</p>
              </div>
            </div>
          )} */}

          {mockupImage ? (
            <div className="text-center mt-6">
              <h2 className="font-bold mb-2">🖼️ Generated Mockup Preview</h2>
              <img
                src={mockupImage}
                alt="Final T-shirt mockup"
                className="rounded-lg shadow-2xl mx-auto border-2 border-gray-300"
                style={{ maxWidth: '400px' }}
              />
              <p className="text-gray-500 text-sm mt-2">This is the real Printful mockup</p>
              
              {/* Download Buttons */}
              <div className="flex gap-3 justify-center mt-4">
                <a
                  href={mockupImage}
                  download={`mockup-preview-${Date.now()}.jpg`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
                >
                  <Download size={18} />
                  Download Preview
                </a>
                
                {preview?.uploadedImage && (
                  <a
                    href={preview.uploadedImage}
                    download={`print-file-${Date.now()}.png`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition"
                  >
                    <Download size={18} />
                    Download Print File
                  </a>
                )}
              </div>
            </div>
          ) : (
            preview?.uploadedImage && (
              <div className="text-center mt-6">
                <h2 className="font-bold mb-2">Tweet Design Uploaded</h2>
                <img src={preview.uploadedImage} alt="Tweet art" className="rounded-lg shadow-lg mx-auto" />
              </div>
            )
          )}


          {/* Right: Customizer */}
          {preview && (
            <div className="lg:col-span-1 bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Step 2: Customize</h2>

              {/* Color Selector */}
              <div className="mb-6">
                <h3 className="font-bold text-gray-900 mb-3 text-sm">SELECT COLOR</h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(colors).map(([key, value]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedColor(key)}
                      className={`p-3 rounded-lg border-4 transition font-semibold text-sm ${
                        selectedColor === key
                          ? 'border-blue-600 ring-2 ring-blue-300 scale-105'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: value.hex, color: value.hex === '#FFFFFF' ? '#333' : '#fff' }}
                    >
                      {value.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size Selector */}
              <div className="mb-8">
                <h3 className="font-bold text-gray-900 mb-3 text-sm">SELECT SIZE</h3>
                <div className="grid grid-cols-3 gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`py-2 rounded-lg font-bold text-sm transition ${
                        selectedSize === size
                          ? 'bg-blue-600 text-white scale-105'
                          : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price & Add to Cart */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border-2 border-blue-200">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-bold text-gray-900">Total Price</h3>
                  <p className="text-3xl font-bold text-blue-600">$29.99</p>
                </div>
                <p className="text-xs text-gray-600 mb-4">
                  {colors[selectedColor].name} • Size {selectedSize} • Premium Quality
                </p>
                <button
                  onClick={handleAddToCart}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition transform hover:scale-105"
                >
                  Add to Cart
                </button>
              </div>

              {/* Success Message */}
              {cart && (
                <div className="mt-4 bg-green-50 border-2 border-green-500 rounded-lg p-4 text-center animate-bounce">
                  <p className="text-green-700 font-bold">✓ Added to Cart!</p>
                  <p className="text-xs text-green-600">Proceed to checkout</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* How it Works */}
        {!preview && (
          <div className="mt-12 bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-5xl mb-4">📋</div>
                <h3 className="font-bold text-gray-900 mb-2">1. Paste Tweet</h3>
                <p className="text-gray-600 text-sm">Share any public tweet URL</p>
              </div>
              <div className="text-center">
                <div className="text-5xl mb-4">🎨</div>
                <h3 className="font-bold text-gray-900 mb-2">2. Customize</h3>
                <p className="text-gray-600 text-sm">Pick color, size & position the print</p>
              </div>
              <div className="text-center">
                <div className="text-5xl mb-4">📦</div>
                <h3 className="font-bold text-gray-900 mb-2">3. Order</h3>
                <p className="text-gray-600 text-sm">Ship in 5-7 days</p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 text-gray-600 text-sm">
          <p>✨ Real product mockups with direct printing</p>
        </div>
      </div>
    </div>
  );
}