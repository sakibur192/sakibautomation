const express = require("express");

const {
    startBrowser,
    saveSession,
    getPage,
     getContext
} = require("./browser");


const app = express();

app.use(express.json());



const queue = [];
let processing = false;

async function processQueue() {

    if (processing) {
        return;
    }

    processing = true;

    while (queue.length > 0) {

        const job = queue.shift();

        try {

            const result = await job.task();

            job.resolve(result);

        } catch (err) {

            job.reject(err);

        }

    }

    processing = false;
}

function addToQueue(task) {

    return new Promise((resolve, reject) => {

        queue.push({
            task,
            resolve,
            reject
        });

        processQueue();

    });

}








const { Client } = require('pg');

// Hardcoded database configurations as requested
const client = new Client({
  user: 'sakib_user',
  host: 'localhost', // Since the DB is on the same VPS
  database: 'sakib_db',
  password: 'sakib_user',
  port: 5432,
});

async function connectDB() {
  try {
    await client.connect();
    console.log('Successfully connected to PostgreSQL database!');
    
    // Quick test query to verify everything works
    const res = await client.query('SELECT NOW()');
    console.log('Database time:', res.rows[0].now);
    
  } catch (err) {
    console.error('Connection error', err.stack);
  }
}

connectDB();


















app.get("/", (req, res) => {
    res.send("Automation Running");
});



app.get("/history", async (req, res) => {

    try {

        const result = await client.query(`
            SELECT *
            FROM transactions
            ORDER BY id DESC
            LIMIT 500
        `);

        res.json({
            success: true,
            total: result.rows.length,
            data: result.rows
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            error: err.message
        });

    }

});




app.get("/history-failed", async (req, res) => {

    try {

        const result = await client.query(`
            SELECT *
            FROM transactions
            WHERE status = 'FAILED'
            ORDER BY id DESC
        `);

        res.json({
            success: true,
            total: result.rows.length,
            data: result.rows
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            error: err.message
        });

    }

});


app.get("/history/:id", async (req, res) => {

    try {

        const result = await client.query(`
            SELECT *
            FROM transactions
            WHERE id = $1
        `,
        [
            req.params.id
        ]);

        if (result.rows.length === 0) {

            return res.status(404).json({
                success: false,
                error: "Transaction not found"
            });

        }

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            error: err.message
        });

    }

});

app.get("/history-success", async (req, res) => {

    try {

        const result = await client.query(`
            SELECT *
            FROM transactions
            WHERE status = 'SUCCESS'
            ORDER BY id DESC
        `);

        res.json({
            success: true,
            total: result.rows.length,
            data: result.rows
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            error: err.message
        });

    }

});





app.get("/switches", async (req, res) => {

    try {

        const result = await client.query(`
            SELECT *
            FROM automation_settings
            WHERE id = 1
        `);

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            error: err.message
        });

    }

});




app.post("/main-switch/on", async (req, res) => {

    try {

        await client.query(`
            UPDATE automation_settings
            SET
                main_switch = 10,
                updated_at = NOW()
            WHERE id = 1
        `);

        res.json({
            success: true,
            main_switch: 10
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            error: err.message
        });

    }

});



app.post("/main-switch/off", async (req, res) => {

    try {

        await client.query(`
            UPDATE automation_settings
            SET
                main_switch = 0,
                updated_at = NOW()
            WHERE id = 1
        `);

        res.json({
            success: true,
            main_switch: 0
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            error: err.message
        });

    }

});


app.post("/sub-switch/on", async (req, res) => {

    try {

        await client.query(`
            UPDATE automation_settings
            SET
                sub_switch = 20,
                updated_at = NOW()
            WHERE id = 1
        `);

        res.json({
            success: true,
            sub_switch: 20
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            error: err.message
        });

    }

});
app.post("/sub-switch/off", async (req, res) => {

    try {

        await client.query(`
            UPDATE automation_settings
            SET
                sub_switch = 0,
                updated_at = NOW()
            WHERE id = 1
        `);

        res.json({
            success: true,
            sub_switch: 0
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            error: err.message
        });

    }

});


app.get("/setup-database", async (req, res) => {

    try {

        //------------------------------------------------------
        // automation_settings
        //------------------------------------------------------

        await client.query(`

            CREATE TABLE IF NOT EXISTS automation_settings (

                id SERIAL PRIMARY KEY,

                main_switch INTEGER NOT NULL DEFAULT 10,

                sub_switch INTEGER NOT NULL DEFAULT 20,

                updated_at TIMESTAMP NOT NULL DEFAULT NOW()

            )

        `);

        //------------------------------------------------------
        // transactions
        //------------------------------------------------------

        await client.query(`

            CREATE TABLE IF NOT EXISTS transactions (

                id BIGSERIAL PRIMARY KEY,

                type VARCHAR(20) NOT NULL,

                reference_id VARCHAR(100),

                web_user_id BIGINT,

                withdraw_code VARCHAR(100),

                amount NUMERIC(18,2),

                status VARCHAR(20) NOT NULL DEFAULT 'PENDING',

                failure_reason TEXT,

                request_json JSONB,

                response_json JSONB,

                duration_ms INTEGER,

                created_at TIMESTAMP NOT NULL DEFAULT NOW(),

                completed_at TIMESTAMP

            )

        `);

        //------------------------------------------------------
        // Insert default settings if table is empty
        //------------------------------------------------------

        const result = await client.query(
            "SELECT COUNT(*) FROM automation_settings"
        );

        if (Number(result.rows[0].count) === 0) {

            await client.query(`

                INSERT INTO automation_settings
                (
                    main_switch,
                    sub_switch
                )
                VALUES
                (
                    10,
                    20
                )

            `);

        }

        res.json({
            success: true,
            message: "Database setup completed."
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            error: err.message
        });

    }

});











async function deposit(webUserId, amount) {

                const page = getPage();

                console.log("\n==============================");
                console.log("START DEPOSIT");
                console.log("User:", webUserId);
                console.log("Amount:", amount);
                console.log("==============================");

                try {

                    //----------------------------------------------------
                    // Open Deposit Modal
                    //----------------------------------------------------

                    console.log("[1] Clicking Deposit button...");

                    await page.getByTestId("deposit-show-button").click();

                    //----------------------------------------------------
                    // Wait for User ID Input
                    //----------------------------------------------------

                    console.log("[2] Waiting for User ID input...");

                    const userInput = page
                        .locator('div[data-testid="deposit-search-user-input"]')
                        .locator("input#client_id");

                    await userInput.waitFor({
                        state: "visible",
                        timeout: 30000
                    });

                    console.log("[3] Filling User ID...");

                    await userInput.click();

                    await userInput.press("Control+A");
                    await userInput.press("Backspace");

                    await userInput.fill(String(webUserId));

                    const typedId = await userInput.inputValue();

                    console.log("Typed User ID =", typedId);

                    if (typedId !== String(webUserId)) {
                        throw new Error(
                            `User ID mismatch. Expected ${webUserId}, Got ${typedId}`
                        );
                    }

                    //----------------------------------------------------
                    // Click Next
                    //----------------------------------------------------

                    console.log("[4] Clicking Next...");

                    const nextButton = page.getByTestId("deposit-search-user-submit");

                    await nextButton.waitFor({
                        state: "visible"
                    });

                    await Promise.all([
                        nextButton.click(),
                        page.waitForLoadState("networkidle").catch(() => {})
                    ]);

                    console.log("[5] Waiting for Amount input...");

                    //----------------------------------------------------
                    // Wait Amount Input
                    //----------------------------------------------------

                    const amountInput = page.locator("input#amount");

                    await amountInput.waitFor({
                        state: "visible",
                        timeout: 30000
                    });

                    console.log("[6] Filling Amount...");

                    await amountInput.click();

                    await amountInput.press("Control+A");
                    await amountInput.press("Backspace");

                    await amountInput.fill(String(amount));

                    const typedAmount = await amountInput.inputValue();

                    console.log("Typed Amount =", typedAmount);

                    //----------------------------------------------------
                    // Deposit Button
                    //----------------------------------------------------

                    console.log("[7] Waiting Deposit button...");

            const depositModal = page.getByTestId("modal-deposit-amount");

            await depositModal.waitFor({
                state: "visible"
            });

            const depositButton = depositModal.getByRole("button", {
                name: "Deposit"
            });

            await depositButton.click();

                    console.log("========== SUCCESS ==========");

                    return {
                        success: true
                    };

                } catch (err) {

                    console.log("========== FAILED ==========");
                    console.log(err);

                    try {

                        await page.screenshot({
                            path: `deposit-error-${Date.now()}.png`,
                            fullPage: true
                        });

                        console.log("Screenshot saved.");

                    } catch {}

                    throw err;
                }

}



// app.post("/deposit", async (req, res) => {

//     try {

//         const { webUserId, amount } = req.body;

//         await deposit(webUserId, amount);

//         res.json({
//             success: true
//         });

//     } catch (e) {

//         console.error(e);

//         res.status(500).json({
//             success: false,
//             error: e.message
//         });

//     }

// });


// app.post("/deposit", async (req, res) => {

//     let transactionId = null;

//     try {

//         const { webUserId, amount } = req.body;

//         if (!webUserId || !amount) {

//             return res.status(400).json({
//                 success: false,
//                 error: "webUserId and amount are required"
//             });

//         }

//         if (getBusyStatus()) {

//             return res.status(409).json({
//                 success: false,
//                 error: "Automation is busy"
//             });

//         }

//         //----------------------------------------------------
//         // Check switches
//         //----------------------------------------------------

//         const setting = await client.query(`
//             SELECT main_switch, sub_switch
//             FROM automation_settings
//             WHERE id = 1
//         `);

//         if (
//             setting.rows.length === 0 ||
//             setting.rows[0].main_switch !== 10 ||
//             setting.rows[0].sub_switch !== 20
//         ) {

//             return res.json({
//                 success: false,
//                 code: 0
//             });

//         }

//         //----------------------------------------------------
//         // Lock automation
//         //----------------------------------------------------

//         setBusyStatus(true);

//         //----------------------------------------------------
//         // Insert transaction
//         //----------------------------------------------------

//         const trx = await client.query(`
//             INSERT INTO transactions
//             (
//                 type,
//                 web_user_id,
//                 amount,
//                 status
//             )
//             VALUES
//             (
//                 'deposit',
//                 $1,
//                 $2,
//                 'PENDING'
//             )
//             RETURNING id
//         `,
//         [
//             webUserId,
//             amount
//         ]);

//         transactionId = trx.rows[0].id;

//         //----------------------------------------------------
//         // Execute automation
//         //----------------------------------------------------

//         await deposit(webUserId, amount);

//         //----------------------------------------------------
//         // Mark success
//         //----------------------------------------------------

//         await client.query(`
//             UPDATE transactions
//             SET
//                 status='SUCCESS',
//                 completed_at=NOW()
//             WHERE id=$1
//         `,
//         [
//             transactionId
//         ]);

//         res.json({
//             success: true
//         });

//     } catch (e) {

//         console.error(e);

//         if (transactionId) {

//             await client.query(`
//                 UPDATE transactions
//                 SET
//                     status='FAILED',
//                     failure_reason=$1,
//                     completed_at=NOW()
//                 WHERE id=$2
//             `,
//             [
//                 e.message,
//                 transactionId
//             ]);

//         }

//         res.status(500).json({
//             success: false,
//             error: e.message
//         });

//     } finally {

//         setBusyStatus(false);

//     }

// });

app.post("/deposit", async (req, res) => {

    try {

        const result = await addToQueue(async () => {

            let transactionId = null;

            const { webUserId, amount } = req.body;

            if (!webUserId || !amount) {

                return {
                    success: false,
                    error: "webUserId and amount are required"
                };

            }

            const setting = await client.query(`
                SELECT main_switch, sub_switch
                FROM automation_settings
                WHERE id = 1
            `);

            if (
                setting.rows.length === 0 ||
                setting.rows[0].main_switch !== 10 ||
                setting.rows[0].sub_switch !== 20
            ) {

                return {
                    success: false,
                    code: 0
                };

            }

            const trx = await client.query(`
                INSERT INTO transactions
                (
                    type,
                    web_user_id,
                    amount,
                    status,
                    request_json
                )
                VALUES
                (
                    'deposit',
                    $1,
                    $2,
                    'PENDING',
                    $3
                )
                RETURNING id
            `,
            [
                webUserId,
                amount,
                JSON.stringify(req.body)
            ]);

            transactionId = trx.rows[0].id;

            try {

                const startTime = Date.now();

                await deposit(webUserId, amount);

                const duration = Date.now() - startTime;

                await client.query(`
                    UPDATE transactions
                    SET
                        status='SUCCESS',
                        duration_ms=$1,
                        response_json=$2,
                        completed_at=NOW()
                    WHERE id=$3
                `,
                [
                    duration,
                    JSON.stringify({
                        success: true
                    }),
                    transactionId
                ]);

                return {
                    success: true
                };

            } catch (err) {

                await client.query(`
                    UPDATE transactions
                    SET
                        status='FAILED',
                        failure_reason=$1,
                        completed_at=NOW()
                    WHERE id=$2
                `,
                [
                    err.message,
                    transactionId
                ]);

                throw err;

            }

        });

        res.json(result);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            error: err.message
        });

    }

});






async function withdraw(withdrawCode) {

    const page = getPage();

    console.log("\n==============================");
    console.log("START WITHDRAW");
    console.log("Code:", withdrawCode);
    console.log("==============================");

    try {

        //------------------------------------------------
        // Open Withdraw Modal
        //------------------------------------------------

        console.log("[1] Open Withdraw");

        await page.getByTestId("withdraw-show-button").click();

        //------------------------------------------------
        // Withdrawal Code Input
        //------------------------------------------------

        console.log("[2] Waiting for code input");

        const codeInput = page.locator("input#code");

        await codeInput.waitFor({
            state: "visible",
            timeout: 30000
        });

        console.log("[3] Filling withdrawal code");

        await codeInput.click();

        await codeInput.press("Control+A");
        await codeInput.press("Backspace");

        await codeInput.fill(String(withdrawCode));

        const typedCode = await codeInput.inputValue();

        console.log("Typed Code =", typedCode);

        if (typedCode !== String(withdrawCode)) {
            throw new Error(
                `Withdrawal code mismatch. Expected ${withdrawCode}, got ${typedCode}`
            );
        }

        //------------------------------------------------
        // Next
        //------------------------------------------------

        console.log("[4] Clicking Next");

        const nextButton = page.getByTestId("withdraw-search-payout-submit");

        await nextButton.waitFor({
            state: "visible"
        });

        await nextButton.click();

        //------------------------------------------------
        // Wait for final Withdraw button
        //------------------------------------------------

        console.log("[5] Waiting for final Withdraw button");

        const withdrawButton = page.getByTestId("withdraw-accept-payout");

        await withdrawButton.waitFor({
            state: "visible",
            timeout: 30000
        });

        console.log("[6] Clicking Withdraw");

        await Promise.all([
            withdrawButton.click(),
            page.waitForLoadState("networkidle").catch(() => {})
        ]);

        console.log("========== WITHDRAW SUCCESS ==========");

        return {
            success: true
        };

    } catch (err) {

        console.log("========== WITHDRAW FAILED ==========");
        console.log(err);

        try {
            await page.screenshot({
                path: `withdraw-error-${Date.now()}.png`,
                fullPage: true
            });
        } catch {}

        throw err;
    }
}


// app.post("/withdraw", async (req, res) => {

//     try {

//         const { withdrawCode } = req.body;

//         if (!withdrawCode) {

//             return res.status(400).json({
//                 success: false,
//                 error: "withdrawCode is required"
//             });

//         }

//         if (getBusyStatus()) {

//             return res.status(409).json({
//                 success: false,
//                 error: "Automation is busy"
//             });

//         }

//         setBusyStatus(true);

//         const result = await withdraw(withdrawCode);

//         res.json({
//             success: true,
//             result
//         });

//     } catch (err) {

//         console.error(err);

//         res.status(500).json({
//             success: false,
//             error: err.message
//         });

//     } finally {

//         setBusyStatus(false);

//     }

// });

// app.post("/withdraw", async (req, res) => {

//     let transactionId = null;

//     try {

//         const { withdrawCode } = req.body;

//         if (!withdrawCode) {

//             return res.status(400).json({
//                 success: false,
//                 error: "withdrawCode is required"
//             });

//         }

//         //----------------------------------------------------
//         // Busy Check
//         //----------------------------------------------------

//         if (getBusyStatus()) {

//             return res.status(409).json({
//                 success: false,
//                 error: "Automation is busy"
//             });

//         }

//         //----------------------------------------------------
//         // Check Switches
//         //----------------------------------------------------

//         const setting = await client.query(`
//             SELECT main_switch, sub_switch
//             FROM automation_settings
//             WHERE id = 1
//         `);

//         if (
//             setting.rows.length === 0 ||
//             setting.rows[0].main_switch !== 10 ||
//             setting.rows[0].sub_switch !== 20
//         ) {

//             return res.json({
//                 success: false,
//                 code: 0
//             });

//         }

//         //----------------------------------------------------
//         // Lock Automation
//         //----------------------------------------------------

//         setBusyStatus(true);

//         //----------------------------------------------------
//         // Create Transaction
//         //----------------------------------------------------

//         const trx = await client.query(`
//             INSERT INTO transactions
//             (
//                 type,
//                 withdraw_code,
//                 status
//             )
//             VALUES
//             (
//                 'withdraw',
//                 $1,
//                 'PENDING'
//             )
//             RETURNING id
//         `,
//         [
//             withdrawCode
//         ]);

//         transactionId = trx.rows[0].id;

//         //----------------------------------------------------
//         // Execute Automation
//         //----------------------------------------------------

//         await withdraw(withdrawCode);

//         //----------------------------------------------------
//         // Success
//         //----------------------------------------------------

//         await client.query(`
//             UPDATE transactions
//             SET
//                 status='SUCCESS',
//                 completed_at=NOW()
//             WHERE id=$1
//         `,
//         [
//             transactionId
//         ]);

//         res.json({
//             success: true
//         });

//     } catch (err) {

//         console.error(err);

//         if (transactionId) {

//             await client.query(`
//                 UPDATE transactions
//                 SET
//                     status='FAILED',
//                     failure_reason=$1,
//                     completed_at=NOW()
//                 WHERE id=$2
//             `,
//             [
//                 err.message,
//                 transactionId
//             ]);

//         }

//         res.status(500).json({
//             success: false,
//             error: err.message
//         });

//     } finally {

//         setBusyStatus(false);

//     }

// });
app.post("/withdraw", async (req, res) => {

    try {

        const result = await addToQueue(async () => {

            let transactionId = null;

            const { withdrawCode } = req.body;

            if (!withdrawCode) {

                return {
                    success: false,
                    error: "withdrawCode is required"
                };

            }

            const setting = await client.query(`
                SELECT main_switch, sub_switch
                FROM automation_settings
                WHERE id = 1
            `);

            if (
                setting.rows.length === 0 ||
                setting.rows[0].main_switch !== 10 ||
                setting.rows[0].sub_switch !== 20
            ) {

                return {
                    success: false,
                    code: 0
                };

            }

            const trx = await client.query(`
                INSERT INTO transactions
                (
                    type,
                    withdraw_code,
                    status,
                    request_json
                )
                VALUES
                (
                    'withdraw',
                    $1,
                    'PENDING',
                    $2
                )
                RETURNING id
            `,
            [
                withdrawCode,
                JSON.stringify(req.body)
            ]);

            transactionId = trx.rows[0].id;

            try {

                const startTime = Date.now();

                await withdraw(withdrawCode);

                const duration = Date.now() - startTime;

                await client.query(`
                    UPDATE transactions
                    SET
                        status='SUCCESS',
                        duration_ms=$1,
                        response_json=$2,
                        completed_at=NOW()
                    WHERE id=$3
                `,
                [
                    duration,
                    JSON.stringify({
                        success: true
                    }),
                    transactionId
                ]);

                return {
                    success: true
                };

            } catch (err) {

                await client.query(`
                    UPDATE transactions
                    SET
                        status='FAILED',
                        failure_reason=$1,
                        completed_at=NOW()
                    WHERE id=$2
                `,
                [
                    err.message,
                    transactionId
                ]);

                throw err;

            }

        });

        res.json(result);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            error: err.message
        });

    }

});
app.get("/queue-status", (req, res) => {

    res.json({
        processing,
        waiting: queue.length
    });

});

async function start() {

    await startBrowser();

    app.listen(3000, () => {
        console.log(
            "Server Running On Port 3000"
        );
    });
}

start();