const express = require("express");
const slugify = require("slugify")
const ExpressError = require("../expressError")
const router = express.Router();
const db = require("../db");


router.get('/', async (req, res, next) => {
    try {
        const results = await db.query(`SELECT * FROM companies`);
        return res.json({companies: results.rows})
    } catch (e) {
        return next(e)
    }
})


router.get('/:code', async (req, res, next) => {
    try {
        const code = req.params.code;
        const compResult = await db.query(
            `SELECT code, name, description
            FROM companies
            WHERE code = $1`, [code]);

        const invResults = await db.query(
            `SELECT id FROM invoices WHERE comp_code = $1`,
            [code]);

        if (compResult.rows.length === 0) {
            throw new ExpressError(`Can't find company with code of ${code}`, 404);
        }

        const company = compResult.rows[0];
        const invoices = invResults.rows;
        company.invoices = invoices.map(inv => inv.id);

        return res.json({ "company": company });

    } catch (e) {
        return next(e);
    }
})


router.post("/", async (req, res, next) => {
    try {
        const { name, description } = req.body;
        let code = slugify(name, {
            lower: true,
            strict: true
        })
        const result = await db.query(
            `INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) 
            RETURNING code, name, description`, [code, name, description]
        );
        return res.status(201).json({company: result.rows[0]})
    } catch (e) {
        return next(e)
    }
});


router.put('/:code', async (req, res, next) => {
    try {
        const { code } = req.params;
        const { name, description } = req.body;
        const results = await db.query('UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING code, name, description', [name, description, code])
        if (results.rows.length === 0) {
            throw new ExpressError(`Can't find company with code of ${code}`, 404)
        }
        return res.json({ company: results.rows[0] })
    } catch (e) {
        return next(e)
    }
});


router.delete('/:code', async (req, res, next) => {
    try {
        const code = req.params.code;
        const result = await db.query(
            `DELETE FROM companies 
            WHERE code = $1
            RETURNING code`, [code])
        if (result.rows.length === 0) {
            throw new ExpressError(`Company code cannot be found: ${code}`, 404)
        } else {
            return res.json({ "status": `Company Deleted: ${code}`})
        }  
    } catch (e) {
        return next(e)
    }
});


module.exports = router;