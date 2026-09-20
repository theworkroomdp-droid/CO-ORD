import API from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {

    await loadPerformancePage();

    setupReportButton();

});


async function loadPerformancePage() {

    try {

        const store =
            typeof API.getStore === "function"
                ? API.getStore()
                : null;

        const currentUser =
            store?.currentUser || {
                id: "user-1",
                name: "Alex",
                role: "Team Member"
            };


        document.getElementById("employeeName").textContent =
            currentUser.name || "Employee";

        document.getElementById("employeeRole").textContent =
            currentUser.role || "Team Member";


        /*
         * Try the backend first.
         */

        let performance = null;

        if (API.getMemberPerformance) {

            performance =
                await API.getMemberPerformance(currentUser.id);

        }


        /*
         * Fallback to local project/task data.
         */

        if (!performance) {

            performance =
                calculateLocalPerformance(currentUser);

        }


        renderPerformance(performance);

    }

    catch (error) {

        console.error(
            "Performance analytics error:",
            error
        );

    }

}


function calculateLocalPerformance(user) {

    const store =
        API.getStore
            ? API.getStore()
            : {};


    const tasks =
        store.tasks || [];


    const projects =
        store.projects || [];


    const userId =
        user.id || "user-1";


    const myTasks =
        tasks.filter(task =>
            String(task.assigneeId) ===
            String(userId)
        );


    const completedTasks =
        myTasks.filter(task =>
            task.status === "completed"
        );


    const completionRate =
        myTasks.length
            ? Math.round(
                completedTasks.length /
                myTasks.length *
                100
            )
            : 0;


    const projectIds =
        [...new Set(
            myTasks.map(task =>
                task.projectId
            )
        )];


    const myProjects =
        projects.filter(project =>
            projectIds.includes(project.id)
        );


    return {

        user: user,

        tasksAssigned:
            myTasks.length,

        tasksCompleted:
            completedTasks.length,

        completionRate:
            completionRate,

        onTimeTasks:
            completedTasks.length,

        activeProjects:
            myProjects.length,

        workload:
            user.workload || "Balanced",

        projects:
            myProjects,

        tasks:
            myTasks,

        activity:
            myTasks
                .slice()
                .reverse()
                .slice(0, 8)
                .map(task => ({

                    title:
                        `${task.status === "completed"
                            ? "Completed"
                            : "Worked on"} ${task.title}`,

                    date:
                        task.dueDate ||
                        "Recent activity"

                }))

    };

}


function renderPerformance(data) {

    document.getElementById("tasksAssigned")
        .textContent =
        data.tasksAssigned || 0;


    document.getElementById("tasksCompleted")
        .textContent =
        data.tasksCompleted || 0;


    document.getElementById("completionRate")
        .textContent =
        `${data.completionRate || 0}%`;


    document.getElementById("onTimeTasks")
        .textContent =
        data.onTimeTasks || 0;


    document.getElementById("activeProjects")
        .textContent =
        data.activeProjects || 0;


    document.getElementById("employeeWorkload")
        .textContent =
        data.workload || "Balanced";


    renderProjects(
        data.projects || []
    );


    renderActivity(
        data.activity || []
    );


    renderCharts(data);

}


function renderProjects(projects) {

    const container =
        document.getElementById(
            "projectContributions"
        );


    if (!projects.length) {

        container.innerHTML = `
            <p class="text-muted">
                No project contributions recorded yet.
            </p>
        `;

        return;

    }


    container.innerHTML =
        projects.map(project => `

            <div
                style="
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                    padding:14px 0;
                    border-bottom:1px solid var(--border-subtle);
                "
            >

                <div>

                    <strong>
                        ${project.name || "Project"}
                    </strong>

                    <div
                        class="text-muted"
                        style="font-size:0.82rem;"
                    >
                        ${project.description || ""}
                    </div>

                </div>

                <span class="badge">
                    Project
                </span>

            </div>

        `).join("");

}


function renderActivity(activity) {

    const container =
        document.getElementById(
            "activityTimeline"
        );


    if (!activity.length) {

        container.innerHTML = `
            <p class="text-muted">
                No recent activity recorded.
            </p>
        `;

        return;

    }


    container.innerHTML =
        activity.map(item => `

            <div
                style="
                    display:flex;
                    gap:14px;
                    padding:12px 0;
                    border-bottom:1px solid var(--border-subtle);
                "
            >

                <i
                    class="fa-solid fa-circle-check"
                    style="
                        color:#34d399;
                        margin-top:4px;
                    "
                ></i>

                <div>

                    <div>
                        ${item.title}
                    </div>

                    <div
                        class="text-muted"
                        style="font-size:0.78rem;"
                    >
                        ${item.date}
                    </div>

                </div>

            </div>

        `).join("");

}


function renderCharts(data) {

    const completionCanvas =
        document.getElementById(
            "completionChart"
        );


    const sprintCanvas =
        document.getElementById(
            "sprintChart"
        );


    new Chart(
        completionCanvas,
        {

            type: "doughnut",

            data: {

                labels: [
                    "Completed",
                    "Remaining"
                ],

                datasets: [

                    {

                        data: [

                            data.tasksCompleted || 0,

                            Math.max(
                                (data.tasksAssigned || 0) -
                                (data.tasksCompleted || 0),
                                0
                            )

                        ]

                    }

                ]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false

            }

        }

    );


    new Chart(
        sprintCanvas,
        {

            type: "bar",

            data: {

                labels: [
                    "Sprint Participation"
                ],

                datasets: [

                    {

                        label:
                            "Completed Tasks",

                        data: [
                            data.tasksCompleted || 0
                        ]

                    }

                ]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                scales: {

                    y: {

                        beginAtZero: true

                    }

                }

            }

        }

    );

}


function setupReportButton() {

    const button =
        document.getElementById(
            "generateReportBtn"
        );


    button.addEventListener(
        "click",
        generateReport
    );


    document.getElementById(
        "closeReportModal"
    ).addEventListener(
        "click",
        closeReport
    );


    document.getElementById(
        "closeReportBtn"
    ).addEventListener(
        "click",
        closeReport
    );


    document.getElementById(
        "printReportBtn"
    ).addEventListener(
        "click",
        () => window.print()
    );

}


async function generateReport() {

    const modal =
        document.getElementById(
            "performanceReportModal"
        );


    const content =
        document.getElementById(
            "performanceReportContent"
        );


    modal.classList.add("active");


    const name =
        document.getElementById(
            "employeeName"
        ).textContent;


    const role =
        document.getElementById(
            "employeeRole"
        ).textContent;


    const assigned =
        document.getElementById(
            "tasksAssigned"
        ).textContent;


    const completed =
        document.getElementById(
            "tasksCompleted"
        ).textContent;


    const rate =
        document.getElementById(
            "completionRate"
        ).textContent;


    const projects =
        document.getElementById(
            "activeProjects"
        ).textContent;


    content.innerHTML = `

        <div
            style="
                border-bottom:1px solid var(--border-subtle);
                padding-bottom:16px;
                margin-bottom:16px;
            "
        >

            <h2>
                Employee Performance Report
            </h2>

            <p class="text-muted">
                CO-ORD Project Management System
            </p>

        </div>


        <div
            style="
                display:grid;
                grid-template-columns:1fr 1fr;
                gap:16px;
                margin-bottom:20px;
            "
        >

            <div>

                <strong>
                    Employee
                </strong>

                <div>
                    ${name}
                </div>

            </div>


            <div>

                <strong>
                    Role
                </strong>

                <div>
                    ${role}
                </div>

            </div>


            <div>

                <strong>
                    Tasks Assigned
                </strong>

                <div>
                    ${assigned}
                </div>

            </div>


            <div>

                <strong>
                    Tasks Completed
                </strong>

                <div>
                    ${completed}
                </div>

            </div>


            <div>

                <strong>
                    Completion Rate
                </strong>

                <div>
                    ${rate}
                </div>

            </div>


            <div>

                <strong>
                    Active Projects
                </strong>

                <div>
                    ${projects}
                </div>

            </div>

        </div>


        <div
            style="
                padding:14px;
                border-left:3px solid #38bdf8;
                background:rgba(56,189,248,0.08);
            "
        >

            This report summarizes project-related
            work activity recorded in CO-ORD.
            It can be reviewed by an authorized
            manager or senior officer when required.

        </div>

    `;

}


function closeReport() {

    document
        .getElementById(
            "performanceReportModal"
        )
        .classList.remove("active");

}