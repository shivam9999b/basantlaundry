/* =====================================================
   BASANTA DRY CLEANLINESS
   success.js — BC ORDER VERSION
===================================================== */


/* =====================================================
   SUPABASE CONFIG
===================================================== */

const SUPABASE_URL =
  "https://ubsyhqkefhtskxjpjzbf.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_hCW9e5LLUWNnQaKDxCP5eg_1tUpo5Tr";

let supabaseClient = null;

if (
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  SUPABASE_ANON_KEY !== "YOUR_SUPABASE_ANON_KEY"
) {

  supabaseClient =
    window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY
    );

}


/* =====================================================
   DOM
===================================================== */

const orderIdElement =
  document.getElementById("orderId");

const copyOrderBtn =
  document.getElementById("copyOrderBtn");

const copyMessage =
  document.getElementById("copyMessage");


/* =====================================================
   START
===================================================== */

document.addEventListener(
  "DOMContentLoaded",
  loadOrder
);


/* =====================================================
   LOAD ORDER
===================================================== */

async function loadOrder() {

  const params =
    new URLSearchParams(
      window.location.search
    );


  let orderNumber =
    params.get("order");


  console.log(
    "URL Order:",
    orderNumber
  );


  /* =========================
     ORDER CHECK
  ========================= */

  if (!orderNumber) {

    showError(
      "Order ID नहीं मिला।"
    );

    return;

  }


  /*
    BC-0001 format को normalize करें
  */

  orderNumber =
    orderNumber
      .trim()
      .toUpperCase();


  /*
    #BC-0001 भी accept करें
  */

  if (
    orderNumber.startsWith("#")
  ) {

    orderNumber =
      orderNumber.substring(1);

  }


  /*
    BC-0001 format check
  */

  if (
    !/^BC-\d{4}$/.test(
      orderNumber
    )
  ) {

    showError(
      "Invalid Order ID. जैसे BC-0001"
    );

    return;

  }


  /* =================================================
     SUPABASE CHECK
  ================================================= */

  if (!supabaseClient) {

    showError(
      "Supabase connection नहीं मिला।"
    );

    return;

  }


  try {

    const {
      data,
      error
    } = await supabaseClient

      .from("orders")

      .select("*")

      .eq(
        "order_number",
        orderNumber
      )

      .maybeSingle();


    /* =========================
       ERROR
    ========================= */

    if (error) {

      console.error(
        "SUPABASE ERROR:",
        error
      );


      showError(
        "Order verify नहीं हो पाया।"
      );

      return;

    }


    /* =========================
       NOT FOUND
    ========================= */

    if (!data) {

      console.error(
        "ORDER NOT FOUND:",
        orderNumber
      );


      showError(
        "यह Order नहीं मिला।"
      );

      return;

    }


    /* =========================
       SUCCESS
    ========================= */

    console.log(
      "ORDER FOUND:",
      data
    );


    showOrderId(
      data.order_number
    );


    /* =================================================
       CUSTOMER NAME
    ================================================= */

    const customerName =
      document.getElementById(
        "customerName"
      );


    if (
      customerName &&
      data.customer_name
    ) {

      customerName.textContent =
        data.customer_name;

    }


    /* =================================================
       STATUS
    ================================================= */

    const orderStatus =
      document.getElementById(
        "orderStatus"
      );


    if (
      orderStatus &&
      data.status
    ) {

      orderStatus.textContent =
        formatStatus(
          data.status
        );

    }


    /* =================================================
       TRACK ORDER BUTTON
    ================================================= */

    const trackButton =
      document.querySelector(
        ".primary-btn"
      );


    if (trackButton) {

      trackButton.href =
        `track.html?order=${encodeURIComponent(
          data.order_number
        )}`;

    }

  }

  catch (error) {

    console.error(
      "LOAD ORDER ERROR:",
      error
    );


    showError(
      "कुछ technical problem हुई।"
    );

  }

}


/* =====================================================
   SHOW ORDER ID
===================================================== */

function showOrderId(
  orderNumber
) {

  if (!orderIdElement) return;


  orderIdElement.textContent =
    orderNumber;


  if (copyMessage) {

    copyMessage.textContent =
      "";

  }

}


/* =====================================================
   FORMAT STATUS
===================================================== */

function formatStatus(
  status
) {

  const statusMap = {

    pending:
      "Order Pending",

    confirmed:
      "Order Confirmed",

    picked_up:
      "Picked Up",

    cleaning:
      "Cleaning",

    ready:
      "Ready",

    out_for_delivery:
      "Out for Delivery",

    delivered:
      "Delivered",

    cancelled:
      "Cancelled"

  };


  return (
    statusMap[status] ||
    status
  );

}


/* =====================================================
   COPY ORDER ID
===================================================== */

if (copyOrderBtn) {

  copyOrderBtn.addEventListener(
    "click",
    async () => {

      if (!orderIdElement) {
        return;
      }


      const orderNumber =
        orderIdElement.textContent
          .trim();


      if (
        !orderNumber ||
        orderNumber ===
          "Unavailable"
      ) {

        return;

      }


      try {

        await navigator.clipboard.writeText(
          orderNumber
        );


        if (copyMessage) {

          copyMessage.textContent =
            "✓ Order ID copied";

          copyMessage.style.color =
            "#176b52";

        }


        copyOrderBtn.textContent =
          "Copied";


        setTimeout(
          () => {

            copyOrderBtn.textContent =
              "Copy Order ID";


            if (copyMessage) {

              copyMessage.textContent =
                "";

            }

          },
          1800
        );

      }

      catch (error) {

        console.error(
          "COPY ERROR:",
          error
        );


        /* Fallback */

        const textarea =
          document.createElement(
            "textarea"
          );


        textarea.value =
          orderNumber;


        document.body.appendChild(
          textarea
        );


        textarea.select();


        document.execCommand(
          "copy"
        );


        textarea.remove();


        if (copyMessage) {

          copyMessage.textContent =
            "✓ Order ID copied";

          copyMessage.style.color =
            "#176b52";

        }

      }

    }
  );

}


/* =====================================================
   ERROR
===================================================== */

function showError(
  message
) {

  if (orderIdElement) {

    orderIdElement.textContent =
      "Unavailable";

  }


  if (copyMessage) {

    copyMessage.textContent =
      message;

    copyMessage.style.color =
      "#c0392b";

  }


  console.error(
    "SUCCESS PAGE ERROR:",
    message
  );

}