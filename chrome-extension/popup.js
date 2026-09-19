const pageTitle = document.getElementById("pageTitle");
const pageUrl = document.getElementById("pageUrl");
const shareButton = document.getElementById("shareButton");
const status = document.getElementById("status");

let currentPage = null;


// Get the currently active Chrome tab
chrome.tabs.query(
    { active: true, currentWindow: true },
    (tabs) => {

        const tab = tabs[0];

        if (!tab) {
            status.textContent = "Unable to detect current page.";
            return;
        }

        currentPage = {
            title: tab.title,
            url: tab.url
        };

        pageTitle.textContent = tab.title;
        pageUrl.textContent = tab.url;
    }
);


// Share resource
shareButton.addEventListener("click", async () => {

    if (!currentPage) {
        status.textContent = "No page detected.";
        return;
    }

    status.textContent = "Sharing...";

    const resource = {
        title: currentPage.title,
        url: currentPage.url,
        type: "web_resource"
    };

    try {

        const response = await fetch(
            "http://localhost:8000/resources",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(resource)
            }
        );


        if (!response.ok) {
            throw new Error(
                `Server returned ${response.status}`
            );
        }


        const data = await response.json();

        console.log("Server response:", data);

        status.textContent = "✓ Shared to CO-ORD!";

    } catch (error) {

        console.error("Sharing failed:", error);

        status.textContent =
            "Could not connect to CO-ORD.";
    }
});