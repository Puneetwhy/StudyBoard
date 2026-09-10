import React, {
  useEffect,
  useRef,
  useState,
  useCallback
} from 'react';
import api from '../api/axios';

const BOARD_WIDTH = 2400;

// Ek page ki height
const PAGE_HEIGHT = 1600;

// Starting board height
const INITIAL_BOARD_HEIGHT = PAGE_HEIGHT;

// Bottom ke paas pahunchne par next page add hoga
const EXPAND_THRESHOLD = 300;

const TOOLS = [
  { key: 'pen', label: 'Pen', icon: '✏️' },
  { key: 'eraser', label: 'Eraser', icon: '🧹' },
  { key: 'line', label: 'Line', icon: '／' },
  { key: 'rect', label: 'Rectangle', icon: '▭' },
  { key: 'circle', label: 'Circle', icon: '◯' }
];

const BACKGROUNDS = {
  white: {
    fill: '#ffffff',
    pattern: null
  },

  grid: {
    fill: '#ffffff',
    pattern: 'grid'
  },

  dotted: {
    fill: '#ffffff',
    pattern: 'dotted'
  },

  dark: {
    fill: '#1e293b',
    pattern: null
  }
};

// Imported images ka cache
const imageCache = new Map();

export default function Whiteboard({
  roomId,
  connected,
  subscribe,
  publish,
  userId,
  isOwner
}) {
  const canvasRef = useRef(null);
  const scrollAreaRef = useRef(null);

  const drawing = useRef(false);
  const draftShape = useRef(null);

  const elementsRef = useRef([]);

  const fileInputRef = useRef(null);

  // Board height ko ref me bhi rakhenge taaki realtime callbacks
  // latest value use kar saken.
  const boardHeightRef = useRef(INITIAL_BOARD_HEIGHT);

  const [boardHeight, setBoardHeight] = useState(
    INITIAL_BOARD_HEIGHT
  );

  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#1e293b');
  const [size, setSize] = useState(3);
  const [dashed, setDashed] = useState(false);

  const [background, setBackground] = useState('white');

  const [panelSize, setPanelSize] = useState('normal');

  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const [zoom, setZoom] = useState(0.5);

  /*
   * ============================================================
   * BOARD HEIGHT
   * ============================================================
   */

  const calculateRequiredHeight = useCallback((elements) => {
    let maxY = 0;

    elements.forEach((el) => {
      if (el.tool === 'image') {
        maxY = Math.max(
          maxY,
          (el.y || 0) + (el.height || 0)
        );

        return;
      }

      if (
        el.tool === 'pen' ||
        el.tool === 'eraser'
      ) {
        if (!el.points?.length) return;

        el.points.forEach((point) => {
          maxY = Math.max(
            maxY,
            point.y || 0
          );
        });

        return;
      }

      if (
        el.tool === 'line' ||
        el.tool === 'rect' ||
        el.tool === 'circle'
      ) {
        if (el.start) {
          maxY = Math.max(
            maxY,
            el.start.y || 0
          );
        }

        if (el.end) {
          maxY = Math.max(
            maxY,
            el.end.y || 0
          );
        }
      }
    });

    // Drawing ke neeche thodi extra space
    const requiredHeight =
      Math.ceil(
        (maxY + 300) / PAGE_HEIGHT
      ) * PAGE_HEIGHT;

    return Math.max(
      INITIAL_BOARD_HEIGHT,
      requiredHeight
    );
  }, []);

  const updateBoardHeight = useCallback(
    (newHeight, broadcast = false) => {
      const safeHeight = Math.max(
        INITIAL_BOARD_HEIGHT,
        newHeight
      );

      if (
        safeHeight <= boardHeightRef.current
      ) {
        return;
      }

      boardHeightRef.current = safeHeight;

      setBoardHeight(safeHeight);

      /*
       * Board height ko sync karna.
       * Isse doosre users ke board par bhi same
       * additional page aa jayega.
       */
      if (broadcast && connected) {
        const payload = JSON.stringify({
          background,
          boardHeight: safeHeight,
          elements: elementsRef.current
        });

        publish(
          `/app/rooms/${roomId}/board.event`,
          {
            type: 'replace',
            senderId: userId,
            payload
          }
        );

        publish(
          `/app/rooms/${roomId}/board.sync`,
          {
            type: 'sync',
            senderId: userId,
            payload
          }
        );
      }
    },
    [
      background,
      connected,
      publish,
      roomId,
      userId
    ]
  );

  /*
   * ============================================================
   * BACKGROUND
   * ============================================================
   */

  const drawBackground = useCallback(
    (ctx) => {
      const bg =
        BACKGROUNDS[background] ||
        BACKGROUNDS.white;

      ctx.fillStyle = bg.fill;

      ctx.fillRect(
        0,
        0,
        BOARD_WIDTH,
        boardHeightRef.current
      );

      if (bg.pattern === 'grid') {
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;

        for (
          let x = 0;
          x < BOARD_WIDTH;
          x += 40
        ) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(
            x,
            boardHeightRef.current
          );
          ctx.stroke();
        }

        for (
          let y = 0;
          y < boardHeightRef.current;
          y += 40
        ) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(
            BOARD_WIDTH,
            y
          );
          ctx.stroke();
        }
      }

      if (bg.pattern === 'dotted') {
        ctx.fillStyle = '#cbd5e1';

        for (
          let x = 20;
          x < BOARD_WIDTH;
          x += 30
        ) {
          for (
            let y = 20;
            y < boardHeightRef.current;
            y += 30
          ) {
            ctx.beginPath();

            ctx.arc(
              x,
              y,
              1.5,
              0,
              Math.PI * 2
            );

            ctx.fill();
          }
        }
      }
    },
    [background]
  );

  /*
   * ============================================================
   * DRAW ELEMENT
   * ============================================================
   */

  const drawElement = useCallback(
    (ctx, el) => {
      if (el.tool === 'image') {
        const img =
          imageCache.get(el.src);

        if (
          img &&
          img.complete
        ) {
          ctx.drawImage(
            img,
            el.x,
            el.y,
            el.width,
            el.height
          );
        }

        return;
      }

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.lineWidth =
        el.size || 3;

      ctx.setLineDash(
        el.dashed
          ? [
              (el.size || 3) * 3,
              (el.size || 3) * 2
            ]
          : []
      );

      if (el.tool === 'eraser') {
        ctx.globalCompositeOperation =
          'destination-out';

        ctx.strokeStyle =
          'rgba(0,0,0,1)';
      } else {
        ctx.globalCompositeOperation =
          'source-over';

        ctx.strokeStyle =
          el.color || '#1e293b';
      }

      /*
       * PEN / ERASER
       */
      if (
        el.tool === 'pen' ||
        el.tool === 'eraser'
      ) {
        if (
          !el.points ||
          el.points.length < 2
        ) {
          ctx.globalCompositeOperation =
            'source-over';

          ctx.setLineDash([]);

          return;
        }

        ctx.beginPath();

        ctx.moveTo(
          el.points[0].x,
          el.points[0].y
        );

        for (
          let i = 1;
          i < el.points.length;
          i++
        ) {
          ctx.lineTo(
            el.points[i].x,
            el.points[i].y
          );
        }

        ctx.stroke();
      }

      /*
       * LINE
       */
      else if (
        el.tool === 'line'
      ) {
        ctx.beginPath();

        ctx.moveTo(
          el.start.x,
          el.start.y
        );

        ctx.lineTo(
          el.end.x,
          el.end.y
        );

        ctx.stroke();
      }

      /*
       * RECTANGLE
       */
      else if (
        el.tool === 'rect'
      ) {
        ctx.strokeRect(
          Math.min(
            el.start.x,
            el.end.x
          ),
          Math.min(
            el.start.y,
            el.end.y
          ),
          Math.abs(
            el.end.x -
              el.start.x
          ),
          Math.abs(
            el.end.y -
              el.start.y
          )
        );
      }

      /*
       * CIRCLE
       */
      else if (
        el.tool === 'circle'
      ) {
        const rx =
          Math.abs(
            el.end.x -
              el.start.x
          ) / 2;

        const ry =
          Math.abs(
            el.end.y -
              el.start.y
          ) / 2;

        const cx =
          (el.start.x +
            el.end.x) / 2;

        const cy =
          (el.start.y +
            el.end.y) / 2;

        ctx.beginPath();

        ctx.ellipse(
          cx,
          cy,
          rx,
          ry,
          0,
          0,
          Math.PI * 2
        );

        ctx.stroke();
      }

      ctx.globalCompositeOperation =
        'source-over';

      ctx.setLineDash([]);
    },
    []
  );

  /*
   * ============================================================
   * REDRAW
   * ============================================================
   */

  const redraw = useCallback(() => {
    const canvas =
      canvasRef.current;

    if (!canvas) return;

    /*
     * Canvas actual height update
     */
    if (
      canvas.height !==
      boardHeightRef.current
    ) {
      canvas.height =
        boardHeightRef.current;
    }

    const ctx =
      canvas.getContext('2d');

    ctx.clearRect(
      0,
      0,
      BOARD_WIDTH,
      boardHeightRef.current
    );

    drawBackground(ctx);

    elementsRef.current.forEach(
      (el) => {
        drawElement(ctx, el);
      }
    );

    if (draftShape.current) {
      drawElement(
        ctx,
        draftShape.current
      );
    }
  }, [
    drawBackground,
    drawElement
  ]);

  /*
   * ============================================================
   * IMAGE LOADING
   * ============================================================
   */

  const ensureImagesLoaded =
    useCallback(
      (elements) => {
        elements.forEach((el) => {
          if (
            el.tool === 'image' &&
            !imageCache.has(el.src)
          ) {
            const img =
              new Image();

            img.onload = () => {
              imageCache.set(
                el.src,
                img
              );

              redraw();
            };

            img.src = el.src;

            imageCache.set(
              el.src,
              img
            );
          }
        });
      },
      [redraw]
    );

  /*
   * ============================================================
   * SNAPSHOT PARSER
   * ============================================================
   */

  const parseSnapshot = (
    raw
  ) => {
    try {
      const parsed =
        JSON.parse(raw);

      /*
       * Old format:
       * [
       *   {...},
       *   {...}
       * ]
       */
      if (
        Array.isArray(parsed)
      ) {
        return {
          background: 'white',
          boardHeight:
            INITIAL_BOARD_HEIGHT,
          elements: parsed
        };
      }

      const elements =
        parsed.elements || [];

      const calculatedHeight =
        calculateRequiredHeight(
          elements
        );

      return {
        background:
          parsed.background ||
          'white',

        boardHeight:
          Math.max(
            parsed.boardHeight ||
              INITIAL_BOARD_HEIGHT,
            calculatedHeight
          ),

        elements
      };
    } catch {
      return {
        background: 'white',
        boardHeight:
          INITIAL_BOARD_HEIGHT,
        elements: []
      };
    }
  };

  /*
   * ============================================================
   * LOAD BOARD
   * ============================================================
   */

  useEffect(() => {
    api
      .get(
        `/api/rooms/${roomId}/whiteboard/snapshot`
      )
      .then(({ data }) => {
        const {
          background: bg,
          boardHeight: savedHeight,
          elements
        } = parseSnapshot(data);

        boardHeightRef.current =
          savedHeight;

        setBoardHeight(
          savedHeight
        );

        setBackground(bg);

        elementsRef.current =
          elements;

        ensureImagesLoaded(
          elements
        );

        /*
         * Canvas size set before redraw
         */
        requestAnimationFrame(
          () => {
            redraw();
          }
        );
      })
      .catch((err) => {
        console.error(
          'Failed to load whiteboard snapshot:',
          err
        );
      });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  /*
   * ============================================================
   * BACKGROUND CHANGE
   * ============================================================
   */

  useEffect(() => {
    redraw();
  }, [
    background,
    boardHeight,
    redraw
  ]);

  /*
   * ============================================================
   * BROADCAST BOARD
   * ============================================================
   */

  const broadcastReplace =
    useCallback(() => {
      const payload =
        JSON.stringify({
          background,
          boardHeight:
            boardHeightRef.current,
          elements:
            elementsRef.current
        });

      publish(
        `/app/rooms/${roomId}/board.event`,
        {
          type: 'replace',
          senderId: userId,
          payload
        }
      );

      publish(
        `/app/rooms/${roomId}/board.sync`,
        {
          type: 'sync',
          senderId: userId,
          payload
        }
      );
    }, [
      background,
      roomId,
      userId,
      publish
    ]);

  /*
   * ============================================================
   * WEBSOCKET SYNC
   * ============================================================
   */

  useEffect(() => {
    if (!connected) return;

    const sub =
      subscribe(
        `/topic/rooms/${roomId}/board`,
        (event) => {
          if (
            event.senderId === userId
          ) {
            return;
          }

          if (
            event.type === 'replace'
          ) {
            const {
              background: bg,
              boardHeight:
                incomingHeight,
              elements
            } =
              parseSnapshot(
                event.payload
              );

            /*
             * Remote board height update
             */
            const finalHeight =
              Math.max(
                INITIAL_BOARD_HEIGHT,
                incomingHeight ||
                  INITIAL_BOARD_HEIGHT
              );

            boardHeightRef.current =
              finalHeight;

            setBoardHeight(
              finalHeight
            );

            setBackground(bg);

            elementsRef.current =
              elements;

            ensureImagesLoaded(
              elements
            );

            requestAnimationFrame(
              () => {
                redraw();
              }
            );
          }
        }
      );

    return () =>
      sub?.unsubscribe?.();
  }, [
    connected,
    roomId,
    subscribe,
    userId,
    redraw,
    ensureImagesLoaded
  ]);

  /*
   * ============================================================
   * AUTO ADD NEXT PAGE
   * ============================================================
   */

  const handleBoardScroll =
    useCallback(() => {
      const container =
        scrollAreaRef.current;

      if (!container) return;

      const distanceFromBottom =
        container.scrollHeight -
        container.scrollTop -
        container.clientHeight;

      /*
       * User bottom ke paas pahunch gaya.
       * Automatically ek aur page add karo.
       */
      if (
        distanceFromBottom <=
        EXPAND_THRESHOLD
      ) {
        const nextHeight =
          boardHeightRef.current +
          PAGE_HEIGHT;

        updateBoardHeight(
          nextHeight,
          true
        );
      }
    }, [
      updateBoardHeight
    ]);

  /*
   * ============================================================
   * GET CANVAS POINT
   * ============================================================
   */

  const getPoint = (
    e
  ) => {
    const canvas =
      canvasRef.current;

    const rect =
      canvas.getBoundingClientRect();

    return {
      x:
        (e.clientX -
          rect.left) *
        (canvas.width /
          rect.width),

      y:
        (e.clientY -
          rect.top) *
        (canvas.height /
          rect.height)
    };
  };

  /*
   * ============================================================
   * POINTER DOWN
   * ============================================================
   */

  const handlePointerDown =
    (e) => {
      if (
        e.pointerType === 'mouse' &&
        e.button !== 0
      ) {
        return;
      }

      const point =
        getPoint(e);

      drawing.current =
        true;

      e.currentTarget?.setPointerCapture?.(
        e.pointerId
      );

      /*
       * PEN / ERASER
       */
      if (
        tool === 'pen' ||
        tool === 'eraser'
      ) {
        elementsRef.current.push({
          tool,
          color,
          size,

          dashed:
            tool === 'pen'
              ? dashed
              : false,

          points: [point]
        });

        return;
      }

      /*
       * SHAPES
       */
      draftShape.current = {
        tool,
        color,
        size,
        dashed,

        start: point,
        end: point
      };
    };

  /*
   * ============================================================
   * POINTER MOVE
   * ============================================================
   */

  const handlePointerMove =
    (e) => {
      if (!drawing.current) {
        return;
      }

      const point =
        getPoint(e);

      /*
       * PEN / ERASER
       */
      if (
        tool === 'pen' ||
        tool === 'eraser'
      ) {
        const current =
          elementsRef.current[
            elementsRef.current.length -
              1
          ];

        if (
          current &&
          current.points
        ) {
          current.points.push(
            point
          );
        }
      }

      /*
       * SHAPES
       */
      else if (
        draftShape.current
      ) {
        draftShape.current.end =
          point;
      }

      redraw();
    };

  /*
   * ============================================================
   * POINTER UP
   * ============================================================
   */

  const handlePointerUp =
    (e) => {
      if (
        !drawing.current
      ) {
        return;
      }

      drawing.current =
        false;

      try {
        e.currentTarget?.releasePointerCapture?.(
          e.pointerId
        );
      } catch {
        // ignore
      }

      if (
        draftShape.current
      ) {
        elementsRef.current.push(
          draftShape.current
        );

        draftShape.current =
          null;
      }

      /*
       * Drawing ke neeche enough
       * space nahi hai to automatically
       * new page add karo.
       */
      const requiredHeight =
        calculateRequiredHeight(
          elementsRef.current
        );

      if (
        requiredHeight >
        boardHeightRef.current
      ) {
        updateBoardHeight(
          requiredHeight,
          false
        );
      }

      redraw();

      broadcastReplace();
    };

  /*
   * ============================================================
   * UNDO
   * ============================================================
   */

  const handleUndo =
    () => {
      if (
        elementsRef.current.length ===
        0
      ) {
        return;
      }

      elementsRef.current.pop();

      redraw();

      broadcastReplace();
    };

  /*
   * ============================================================
   * CLEAR
   * ============================================================
   */

  const handleClear =
    () => {
      elementsRef.current =
        [];

      /*
       * Clear ke baad initial
       * page par wapas.
       */
      boardHeightRef.current =
        INITIAL_BOARD_HEIGHT;

      setBoardHeight(
        INITIAL_BOARD_HEIGHT
      );

      redraw();

      broadcastReplace();
    };

  /*
   * ============================================================
   * IMPORT IMAGE
   * ============================================================
   */

  const handleImport =
    (e) => {
      const file =
        e.target.files?.[0];

      if (!file) return;

      setImporting(true);

      const reader =
        new FileReader();

      reader.onload = () => {
        const src =
          reader.result;

        const img =
          new Image();

        img.onload = () => {
          const maxWidth =
            500;

          const scale =
            Math.min(
              1,
              maxWidth /
                img.naturalWidth
            );

          /*
           * Image ko current
           * visible/scroll position ke
           * aas paas place karne ki
           * koshish.
           */
          const container =
            scrollAreaRef.current;

          const currentScroll =
            container
              ? container.scrollTop
              : 0;

          const displayHeight =
            img.naturalHeight *
            scale;

          const y =
            Math.max(
              40,
              currentScroll +
                40
            );

          elementsRef.current.push({
            tool: 'image',
            src,

            x: 40,
            y,

            width:
              img.naturalWidth *
              scale,

            height:
              displayHeight
          });

          imageCache.set(
            src,
            img
          );

          /*
           * Image neeche ja rahi hai
           * to page automatically add.
           */
          const requiredHeight =
            calculateRequiredHeight(
              elementsRef.current
            );

          if (
            requiredHeight >
            boardHeightRef.current
          ) {
            updateBoardHeight(
              requiredHeight,
              false
            );
          }

          redraw();

          broadcastReplace();

          setImporting(false);
        };

        img.src = src;
      };

      reader.readAsDataURL(file);

      e.target.value = '';
    };

  /*
   * ============================================================
   * EXPORT
   * ============================================================
   */

  const handleExport =
    async () => {
      setExporting(true);

      try {
        /*
         * Ensure latest canvas draw
         */
        redraw();

        const imageBase64 =
          canvasRef.current.toDataURL(
            'image/png'
          );

        const { data } =
          await api.post(
            '/api/export/whiteboard',
            {
              roomId,
              imageBase64
            }
          );

        window.open(
          data.url,
          '_blank'
        );
      } catch (err) {
        console.error(
          'Whiteboard export failed:',
          err
        );

        alert(
          'Export failed. Please try again.'
        );
      } finally {
        setExporting(false);
      }
    };

  /*
   * ============================================================
   * PANEL CLASS
   * ============================================================
   */

  const containerClass =
    panelSize === 'maximized'
      ? 'fixed inset-0 z-50 flex min-h-0 flex-col bg-slate-100'
      : panelSize === 'minimized'
      ? 'flex flex-col'
      : 'flex h-full min-h-0 flex-col';

  /*
   * ============================================================
   * UI
   * ============================================================
   */

  return (
    <div
      className={containerClass}
    >
      {/* ========================================================
          TOOLBAR
      ======================================================== */}

      <div className="sticky top-0 z-30 shrink-0 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-2 p-3">

          {/* TOOL GROUP */}
          <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-1 scrollbar-hide">

            {TOOLS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() =>
                  setTool(t.key)
                }
                title={t.label}
                className={`group flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold transition-all duration-200 ${
                  tool === t.key
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-200'
                    : 'text-slate-500 hover:bg-white hover:text-slate-800 hover:shadow-sm'
                }`}
              >
                <span className="text-sm">
                  {t.icon}
                </span>

                <span className="hidden sm:inline">
                  {t.label}
                </span>
              </button>
            ))}
          </div>

          {/* DIVIDER */}
          <div className="hidden h-8 w-px bg-slate-200 lg:block" />

          {/* COLOR */}
          <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 shadow-sm">
            <input
              type="color"
              value={color}
              onChange={(e) =>
                setColor(
                  e.target.value
                )
              }
              title="Color"
              className="h-7 w-7 cursor-pointer overflow-hidden rounded-lg border border-slate-200 bg-white p-0.5"
            />

            <span className="hidden text-[10px] font-semibold uppercase tracking-wider text-slate-400 md:block">
              Color
            </span>
          </div>

          {/* SIZE */}
          <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm">
            <span className="hidden text-[10px] font-semibold uppercase tracking-wider text-slate-400 md:inline">
              Size
            </span>

            <input
              type="range"
              min="1"
              max="30"
              value={size}
              onChange={(e) =>
                setSize(
                  Number(
                    e.target.value
                  )
                )
              }
              className="w-20 accent-indigo-600 sm:w-24"
            />

            <span className="min-w-[20px] text-center text-xs font-bold text-slate-600">
              {size}
            </span>
          </div>

          {/* DASHED */}
          <label
            className={`flex h-11 cursor-pointer items-center gap-2 rounded-xl border px-3 text-xs font-semibold transition ${
              dashed
                ? 'border-indigo-200 bg-indigo-50 text-indigo-600'
                : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
            }`}
          >
            <input
              type="checkbox"
              checked={dashed}
              onChange={(e) =>
                setDashed(
                  e.target.checked
                )
              }
              className="h-3.5 w-3.5 accent-indigo-600"
            />

            <span className="hidden sm:inline">
              Dashed
            </span>

            <span className="sm:hidden">
              Dash
            </span>
          </label>

          {/* BACKGROUND */}
          <select
            value={background}
            onChange={(e) =>
              setBackground(
                e.target.value
              )
            }
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 shadow-sm outline-none transition hover:border-indigo-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
            title="Background"
          >
            <option value="white">
              White
            </option>

            <option value="grid">
              Grid
            </option>

            <option value="dotted">
              Dotted
            </option>

            <option value="dark">
              Dark
            </option>
          </select>

          {/* HISTORY */}
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">

            <button
              type="button"
              onClick={handleUndo}
              title="Undo"
              className="flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            >
              <span className="text-base">
                ↩
              </span>

              <span className="hidden md:inline">
                Undo
              </span>
            </button>

            <button
              type="button"
              onClick={handleClear}
              title="Clear board"
              className="flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-slate-500 transition hover:bg-red-50 hover:text-red-600"
            >
              Clear
            </button>
          </div>

          {/* RIGHT ACTIONS */}
          <div className="ml-auto flex w-full items-center justify-end gap-2 sm:w-auto">

            {/* CONNECTION */}
            <div
              className={`hidden items-center gap-2 rounded-full border px-3 py-2 text-[10px] font-bold uppercase tracking-wider sm:flex ${
                connected
                  ? 'border-emerald-100 bg-emerald-50 text-emerald-600'
                  : 'border-amber-100 bg-amber-50 text-amber-600'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  connected
                    ? 'bg-emerald-500'
                    : 'animate-pulse bg-amber-500'
                }`}
              />

              {connected
                ? 'Live'
                : 'Offline'}
            </div>

            {/* IMPORT / EXPORT */}
            {isOwner ? (
              <>
                <button
                  type="button"
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  disabled={importing}
                  className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-50"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 16V4m0 0L8 8m4-4l4 4M5 20h14"
                    />
                  </svg>

                  <span className="hidden sm:inline">
                    {importing
                      ? 'Importing…'
                      : 'Import'}
                  </span>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={
                    handleImport
                  }
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={
                    handleExport
                  }
                  disabled={exporting}
                  className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3.5 text-xs font-semibold text-white shadow-md shadow-indigo-200 transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50"
                >
                  {exporting ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                      <span className="hidden sm:inline">
                        Exporting…
                      </span>
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 4v11m0 0l4-4m-4 4l-4-4M5 20h14"
                        />
                      </svg>

                      <span className="hidden sm:inline">
                        Export PDF
                      </span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <span className="hidden text-[10px] font-medium text-slate-400 xl:inline">
                Creator only: import/export
              </span>
            )}

            {/* ZOOM */}
            <div className="flex h-10 items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">

              <button
                type="button"
                onClick={() =>
                  setZoom(
                    (z) =>
                      Math.max(
                        0.25,
                        Number(
                          (
                            z -
                            0.1
                          ).toFixed(
                            2
                          )
                        )
                      )
                  )
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                title="Zoom out"
              >
                −
              </button>

              <button
                type="button"
                onClick={() =>
                  setZoom(0.5)
                }
                className="min-w-[48px] rounded-lg px-1 text-[10px] font-bold text-slate-600 hover:bg-slate-100"
                title="Reset zoom"
              >
                {Math.round(
                  zoom * 100
                )}
                %
              </button>

              <button
                type="button"
                onClick={() =>
                  setZoom(
                    (z) =>
                      Math.min(
                        1.5,
                        Number(
                          (
                            z +
                            0.1
                          ).toFixed(
                            2
                          )
                        )
                      )
                  )
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                title="Zoom in"
              >
                +
              </button>
            </div>

            {/* MAXIMIZE */}
            <button
              type="button"
              onClick={() =>
                setPanelSize(
                  (current) =>
                    current ===
                    'maximized'
                      ? 'normal'
                      : 'maximized'
                )
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
              title={
                panelSize ===
                'maximized'
                  ? 'Restore'
                  : 'Maximize'
              }
            >
              <span className="text-base">
                {panelSize ===
                'maximized'
                  ? '⤡'
                  : '⤢'}
              </span>
            </button>

            {/* MINIMIZE */}
            <button
              type="button"
              onClick={() =>
                setPanelSize(
                  (current) =>
                    current ===
                    'minimized'
                      ? 'normal'
                      : 'minimized'
                )
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
              title={
                panelSize ===
                'minimized'
                  ? 'Expand'
                  : 'Minimize'
              }
            >
              <span className="text-base">
                {panelSize ===
                'minimized'
                  ? '▾'
                  : '▸'}
              </span>
            </button>
          </div>
        </div>

        {/* MOBILE STATUS */}
        <div className="border-t border-slate-100 px-3 py-2 sm:hidden">
          <div
            className={`flex w-fit items-center gap-2 rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${
              connected
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-amber-50 text-amber-600'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                connected
                  ? 'bg-emerald-500'
                  : 'animate-pulse bg-amber-500'
              }`}
            />

            {connected
              ? 'Whiteboard Live'
              : 'Connecting'}
          </div>
        </div>
      </div>

      {/* ========================================================
          CANVAS AREA
      ======================================================== */}

      {panelSize !==
        'minimized' && (
        <div
          ref={scrollAreaRef}
          onScroll={
            handleBoardScroll
          }
          className="relative min-h-0 flex-1 overflow-auto bg-slate-100 overscroll-contain"
          style={{
            backgroundImage: `
              radial-gradient(
                circle at 50% 0%,
                rgba(99,102,241,0.08),
                transparent 35%
              ),
              linear-gradient(
                to right,
                rgba(148,163,184,0.10) 1px,
                transparent 1px
              ),
              linear-gradient(
                to bottom,
                rgba(148,163,184,0.10) 1px,
                transparent 1px
              )
            `,
            backgroundSize:
              'auto, 32px 32px, 32px 32px'
          }}
        >

          {/* HINT */}
          <div className="pointer-events-none sticky left-4 top-4 z-10 flex w-fit items-center gap-2 rounded-xl border border-white/80 bg-white/85 px-3 py-2 text-[10px] font-semibold text-slate-400 shadow-sm backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-indigo-500" />

            {tool ===
            'pen'
              ? 'Draw freely'
              : tool ===
                'eraser'
              ? 'Erase strokes'
              : `Draw ${tool}`}
          </div>

          {/* ====================================================
              BOARD WRAPPER
          ==================================================== */}

          <div className="flex min-w-fit items-start justify-start p-5 pt-16 sm:p-8 sm:pt-16 lg:justify-center">

            <div
              className="relative shrink-0 overflow-hidden rounded-2xl border border-slate-300/80 bg-white shadow-[0_25px_70px_-25px_rgba(15,23,42,0.35)]"
              style={{
                width:
                  BOARD_WIDTH *
                  zoom,

                height:
                  boardHeight *
                  zoom
              }}
            >

              {/* BOARD SHADOW */}
              <div className="pointer-events-none absolute inset-0 z-10 rounded-2xl ring-1 ring-inset ring-black/5" />

              {/* PAGE SEPARATORS
                  Har 1600 board pixels ke baad
                  ek subtle separator. */}
              <div className="pointer-events-none absolute inset-0 z-20">
                {Array.from(
                  {
                    length:
                      Math.floor(
                        boardHeight /
                          PAGE_HEIGHT
                      ) - 1
                  },
                  (_, index) => {
                    const y =
                      (index + 1) *
                      PAGE_HEIGHT *
                      zoom;

                    return (
                      <div
                        key={index}
                        className="absolute left-0 right-0 border-t-2 border-dashed border-slate-300/70"
                        style={{
                          top: y
                        }}
                      >
                        <span className="absolute right-3 -top-3 rounded-md bg-slate-100 px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                          Page {index + 2}
                        </span>
                      </div>
                    );
                  }
                )}
              </div>

              <canvas
                ref={canvasRef}
                width={BOARD_WIDTH}
                height={boardHeight}
                onPointerDown={
                  handlePointerDown
                }
                onPointerMove={
                  handlePointerMove
                }
                onPointerUp={
                  handlePointerUp
                }
                onPointerCancel={
                  handlePointerUp
                }
                className="block bg-white"
                style={{
                  width:
                    BOARD_WIDTH *
                    zoom,

                  height:
                    boardHeight *
                    zoom,

                  cursor:
                    tool ===
                    'eraser'
                      ? 'cell'
                      : 'crosshair',

                  touchAction:
                    'none'
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MINIMIZED
      ======================================================== */}

      {panelSize ===
        'minimized' && (
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/80 px-4 py-3">

          <div className="flex items-center gap-3">

            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              ✏️
            </div>

            <div>
              <p className="text-xs font-bold text-slate-700">
                Whiteboard minimized
              </p>

              <p className="text-[10px] text-slate-400">
                Expand to continue drawing
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              setPanelSize(
                'normal'
              )
            }
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-200 transition hover:-translate-y-0.5"
          >
            Expand board
          </button>
        </div>
      )}
    </div>
  );
}