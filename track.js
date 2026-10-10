/* =====================================================
   BASANTA DRY CLEANLINESS
   track.js — UPDATED
===================================================== */


/* =====================================================
   SUPABASE
===================================================== */

const SUPABASE_URL =
  "https://ubsyhqkefhtskxjpjzbf.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_hCW9e5LLUWNnQaKDxCP5eg_1tUpo5Tr";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );


/* =====================================================
   DOM
===================================================== */

const trackForm =
  document.getElementById("trackForm");

const orderIdInput =
  document.getElementById("orderId");

const trackBtn =
  document.getElementById("trackBtn");

const trackMessage =
  document.getElementById("trackMessage");

const orderResult =
  document.getElementById("orderResult");

const resultOrderId =
  document.getElementById("resultOrderId");

const resultStatus =
  document.getElementById("resultStatus");

const customerName =
  document.getElementById("customerName");

const pickupDate =
  document.getElementById("pickupDate");

const pickupTime =
  document.getElementById("pickupTime");


/* =====================================================
   STATUS ORDER
===================================================== */

const statusSteps = [
  "pending",
  "pickup",
  "cleaning",
  "pressing",
  "ready",
  "delivered"
];


/* =====================================================
   STATUS TEXT
===================================================== */

const statusNames = {

  pending:
    "Pending",

  pickup:
    "Pickup",

  cleaning:
    "Cleaning",

  pressing:
    "Pressing",

  ready:
    "Ready",

  delivered:
    "Delivered"

};


/* =====================================================
   PAGE LOAD
===================================================== */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const params =
      new URLSearchParams(
        window.location.search
      );

    const order =
      params.get("order");

    if (order) {

      orderIdInput.value =
        order;

      searchOrder(order);

    }

  }
);


/* =====================================================
   FORM
===================================================== */

if (trackForm) {

  trackForm.addEventListener(
    "submit",
    event => {

      event.preventDefault();

      const orderId =
        orderIdInput.value.trim();

      if (!orderId) {

        showMessage(
          "कृपया Order ID डालें।",
          true
        );

        return;

      }

      searchOrder(orderId);

    }
  );

}


/* =====================================================
   SEARCH ORDER
===================================================== */

async function searchOrder(
  orderId
) {

  const cleanOrderId =
    orderId.trim().toUpperCase();


  showMessage(
    "Order खोजा जा रहा है...",
    false
  );


  if (trackBtn) {

    trackBtn.disabled =
      true;

    trackBtn.textContent =
      "Searching...";

  }


  if (orderResult) {

    orderResult.hidden =
      true;

  }


  try {

    /*
      Order number से search

      Example:
      BC-0001
      BC-0627
      BC-8117
    */

    const {
      data,
      error
    } = await supabaseClient
      .from("orders")
      .select(`
        id,
        order_number,
        customer_name,
        pickup_date,
        pickup_time,
        status,
        service_name,
        service_price,
        notes,
        updated_at,
        created_at
      `)
      .eq(
        "order_number",
        cleanOrderId
      )
      .maybeSingle();


    if (error) {

      console.error(
        "TRACK ORDER ERROR:",
        error
      );

      showMessage(
        "Order खोजने में समस्या हुई।",
        true
      );

      return;

    }


    if (!data) {

      showMessage(
        "यह Order ID नहीं मिली। जैसे BC-0001 डालें।",
        true
      );

      return;

    }


    /*
      Order मिल गया
    */

    renderOrder(data);


    showMessage(
      "✓ Order मिल गया",
      false
    );

  }

  catch (error) {

    console.error(
      "TRACK EXCEPTION:",
      error
    );

    showMessage(
      "Order खोजने में समस्या हुई।",
      true
    );

  }

  finally {

    if (trackBtn) {

      trackBtn.disabled =
        false;

      trackBtn.textContent =
        "Track";

    }

  }

}


/* =====================================================
   RENDER ORDER
===================================================== */

function renderOrder(
  order
) {

  if (!orderResult) return;


  /* =========================
     ORDER ID
  ========================= */

  resultOrderId.textContent =
    order.order_number ||
    "Order";


  /* =========================
     STATUS
  ========================= */

  let currentStatus =
    normalizeStatus(
      order.status
    );


  resultStatus.textContent =
    statusNames[currentStatus] ||
    "Pending";


  resultStatus.className =
    "status status-" +
    currentStatus;


  /* =========================
     CUSTOMER
  ========================= */

  customerName.textContent =
    order.customer_name ||
    "-";


  /* =========================
     PICKUP DATE
  ========================= */

  pickupDate.textContent =
    formatDate(
      order.pickup_date
    );


  /* =========================
     PICKUP TIME
  ========================= */

  pickupTime.textContent =
    order.pickup_time ||
    "-";


  /* =========================
     TIMELINE
  ========================= */

  updateTimeline(
    currentStatus
  );


  /* =========================
     SHOW RESULT
  ========================= */

  orderResult.hidden =
    false;


  /*
    URL में Order ID रखें
  */

  const url =
    new URL(
      window.location.href
    );

  url.searchParams.set(
    "order",
    order.order_number
  );

  window.history.replaceState(
    {},
    "",
    url
  );

}


/* =====================================================
   NORMALIZE STATUS
===================================================== */

function normalizeStatus(
  status
) {

  if (!status) {

    return "pending";

  }


  const value =
    String(status)
      .toLowerCase()
      .trim();


  /*
    पुराने status को भी support करें
  */

  if (
    value === "confirmed"
  ) {

    return "pickup";

  }


  if (
    value === "picked_up" ||
    value === "picked up"
  ) {

    return "pickup";

  }


  if (
    value === "out_for_delivery" ||
    value === "out for delivery" ||
    value === "delivery"
  ) {

    return "ready";

  }


  if (
    statusSteps.includes(
      value
    )
  ) {

    return value;

  }


  return "pending";

}


/* =====================================================
   UPDATE TIMELINE
===================================================== */

function updateTimeline(
  currentStatus
) {

  const currentIndex =
    statusSteps.indexOf(
      currentStatus
    );


  const items =
    document.querySelectorAll(
      ".timeline-item"
    );


  items.forEach(
    item => {

      const status =
        item.dataset.status;


      const index =
        statusSteps.indexOf(
          status
        );


      item.classList.remove(
        "active",
        "completed"
      );


      /*
        Current status
      */

      if (
        index === currentIndex
      ) {

        item.classList.add(
          "active"
        );

      }


      /*
        Previous status
      */

      else if (
        index < currentIndex
      ) {

        item.classList.add(
          "completed"
        );

      }

    }
  );

}


/* =====================================================
   MESSAGE
===================================================== */

function showMessage(
  message,
  isError
) {

  if (!trackMessage) return;


  trackMessage.textContent =
    message;


  trackMessage.style.color =
    isError
      ? "#b43b35"
      : "#176b52";

}


/* =====================================================
   DATE FORMAT
===================================================== */

function formatDate(
  date
) {

  if (!date) {

    return "-";

  }


  /*
    YYYY-MM-DD को
    बिना timezone problem के दिखाएँ
  */

  const parts =
    String(date).split("-");


  if (
    parts.length !== 3
  ) {

    return date;

  }


  return `${parts[2]}-${parts[1]}-${parts[0]}`;

}


/* =====================================================
   AUTO REFRESH
   Admin में status बदलने के बाद
   Track page पर latest status आएगा।
===================================================== */

let refreshTimer = null;


function startAutoRefresh() {

  if (refreshTimer) {

    clearInterval(
      refreshTimer
    );

  }


  refreshTimer =
    setInterval(
      () => {

        const orderId =
          orderIdInput?.value
            ?.trim();


        if (orderId) {

          searchOrder(
            orderId
          );

        }

      },
      15000
    );

}


startAutoRefresh();