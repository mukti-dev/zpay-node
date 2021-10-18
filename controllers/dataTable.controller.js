const { findOperatorRecords, finduserList, walletUserRecords, todayRechargeRecords, oldRechargeRecords, pendingRechargeRecords, walletTransactionRecords, getOperatorsByCode, walletBalanceRecords } = require("../managers/dataTable.manager");
const operatorConfig = require('../config/operatorConfig.json')
const moment = require('moment');
const { getNaration } = require("../services/narationText");
const getoperatorList = async (req, res) => {
    let optCode = []
    for (let i = 0; i < operatorConfig.length; i++) {
        optCode.push(operatorConfig[i].operatorCode)

    }
    const operators = await getOperatorsByCode(optCode)
    let operatorResult = []
    for (let i = 0; i < operatorConfig.length; i++) {
        let obj = operatorConfig[i]
        obj.sl_no = i + 1
        obj._id = ""
        obj.zpayCashback = 0
        obj.customerCashback = 0
        obj.status = 'Inactive'
        for (let j = 0; j < operators.length; j++) {

            if (operatorConfig[i].operatorCode === operators[j].operatorCode) {
                obj._id = operators[j]._id
                obj.zpayCashback = operators[j].cashbackPercentageForZpay
                obj.customerCashback = operators[j].cashbackPercentageForCustomer
                obj.status = operators[j].status
            }


        }
        operatorResult.push(obj)
    }
    // console.log(operatorResult)
    res.json({ data: operatorResult })
}
const operatorList = async (req, res) => {
    const postData = JSON.parse(JSON.stringify(req.body));
    let draw = postData.draw;
    let row = postData.start;

    let rowperpage = postData.length; // Rows display per page
    let columnIndex = postData["order[0][column]"];// Column index
    let columnName = postData['columns[' + columnIndex + '][data]'];// Column name
    if (columnName == "sl_no") {
        columnName = "createdAt"
    }

    let columnSortOrder = postData['order[0][dir]'];// asc or desc
    let searchValue = postData['search[value]']// Search value
    let totalRecords = 0
    let filter = {
        skip: row,
        limit: rowperpage,
        document: columnName,
        sort: columnSortOrder
    }
    totalRecords = await findOperatorRecords(searchValue, filter, 'count')
    let totalRecordwithFilter = totalRecords
    let records = await findOperatorRecords(searchValue, filter, 'records')

    let data = []
    for (let i = 0; i < records.length; i++) {
        let obj = {
            sl_no: i + 1,
            operatorCode: records[i].operatorCode,
            name: records[i].name,
            cashbackPercentageForZpay: records[i].cashbackPercentageForZpay + ' %',
            cashbackPercentageForCustomer: records[i].cashbackPercentageForCustomer + ' %',
            status: records[i].status,
            action: ` <a href="javascript:void(0)" routerLink="operator-edit/${records[i]._id}" class="btn btn-info btn-xs">
                <span class="fa fa-pencil"></span> Edit</a> <button onclick=onDeleteOperatorClick('${records[i]._id}')
                class="btn btn-danger btn-xs"><span class="fa fa-trash"></span>Delete</button>`
        }
        data.push(obj)
    }

    const response = {
        "draw": draw,
        "iTotalRecords": totalRecords,
        "iTotalDisplayRecords": totalRecordwithFilter,
        "aaData": data
    }
    res.json(response)

}

const userList = async (req, res) => {
    const postData = JSON.parse(JSON.stringify(req.body));
    let draw = postData.draw;
    let row = postData.start;

    let rowperpage = postData.length; // Rows display per page
    let columnIndex = postData["order[0][column]"];// Column index
    let columnName = postData['columns[' + columnIndex + '][data]'];// Column name

    if (columnName == "sl_no") {
        columnName = "createdAt"
    }

    let columnSortOrder = postData['order[0][dir]'];// asc or desc
    let searchValue = postData['search[value]']// Search value
    let totalRecords = 0
    let filter = {
        skip: row,
        limit: rowperpage,
        document: columnName,
        sort: columnSortOrder
    }
    totalRecords = await finduserList(searchValue, filter, 'count')
    let totalRecordwithFilter = totalRecords
    let records = await finduserList(searchValue, filter, 'records')

    let data = []
    for (let i = 0; i < records.length; i++) {
        let activeclass = ""
        if (records[i].status == "Active" || records[i].status == "active") {
            activeclass = "btn-primary"
        } else {
            activeclass = "btn-secondary"
        }
        let obj = {
            sl_no: i + 1,
            name: records[i].name,
            email: records[i].email,
            phone: records[i].phone,
            walletBalance: records[i].walletBalance,
            date: moment(records[i].walletData[0].createdAt).format("DD-MM-YYYY hh:mm A"),
            status: `<a href="javascript:void(0)" id="user-status-${records[i]._id}" onclick="changeUserStatus('${records[i]._id}','${records[i].status}', 'user-status-${records[i]._id}')" class="btn ${activeclass} btn-xs">
                <span class="fa fa-pencil"></span> ${records[i].status}</a> `,
            action: ` <button onclick=userWalletRedirection('${records[i]._id}')
                class="btn btn-success btn-xs"><span class="fa fa-money"></span>Wallet</button>`
        }
        data.push(obj)
    }

    const response = {
        "draw": draw,
        "iTotalRecords": totalRecords,
        "iTotalDisplayRecords": totalRecordwithFilter,
        "aaData": data
    }
    res.json(response)
}

const userWalletList = async (req, res) => {
    const postData = JSON.parse(JSON.stringify(req.body));
    let draw = postData.draw;
    let row = postData.start;

    let rowperpage = postData.length; // Rows display per page
    let columnIndex = postData["order[0][column]"];// Column index
    let columnName = postData['columns[' + columnIndex + '][data]'];// Column name
    if (columnName == "sl_no") {
        columnName = "createdAt"
    }
    let columnSortOrder = postData['order[0][dir]'];// asc or desc
    let searchValue = postData['search[value]']// Search value
    let totalRecords = 0
    let filter = {
        skip: row,
        limit: rowperpage,
        document: columnName,
        sort: columnSortOrder,
        data: { userId: req.params.userId }
    }
    // totalRecords = await walletUserRecords(searchValue, filter, 'count')
    let totalRecordwithFilter = totalRecords
    let records = await walletUserRecords(searchValue, filter, 'records')
    totalRecordwithFilter = records.length

    let data = []
    records.forEach((element, index) => {
        let optCode = element.operator || 'N/A'
        let operatorData = operatorConfig.find(e => e.operatorCode === optCode);
        let service = operatorData.operatorType
        let operator = operatorData.operatorName
        let obj = {
            sl_no: index + 1,
            name: element.name,
            phone: element.phone,
            createdAt: moment(element.createdAt).format('DD-MM-YYYY hh:mm A'),
            service: service,
            operator: operator,
            naration: getNaration(element._id, element.naration),
            credit: element.credit,
            debit: element.debit,
            restAmount: element.restAmount || 'Not Calculated'
        }
        data.push(obj)
    });

    const response = {
        "draw": draw,
        "iTotalRecords": totalRecords,
        "iTotalDisplayRecords": totalRecordwithFilter,
        "aaData": data
    }
    res.json(response)
}

const todayRechargeList = async (req, res) => {
    const postData = JSON.parse(JSON.stringify(req.body));
    let draw = postData.draw;
    let row = postData.start;

    let rowperpage = postData.length; // Rows display per page
    let columnIndex = postData["order[0][column]"];// Column index
    let columnName = postData['columns[' + columnIndex + '][data]'];// Column name
    if (columnName == "sl_no") {
        columnName = "createdAt"
    }
    let columnSortOrder = postData['order[0][dir]'];// asc or desc
    let searchValue = postData['search[value]']// Search value
    let totalRecords = 0
    let filter = {
        skip: row,
        limit: rowperpage,
        document: columnName,
        sort: columnSortOrder,
        data: { userId: req.params.userId }
    }
    totalRecords = await todayRechargeRecords(searchValue, filter, 'count')
    let totalRecordwithFilter = totalRecords
    let records = await todayRechargeRecords(searchValue, filter, 'records')

    let data = []
    records.forEach((element, index) => {
        let optCode = element.operator || 'N/A'
        let operatorData = operatorConfig.find(e => e.operatorCode === optCode);
        let operatorRef = operatorData.operatorType
        let operator = operatorData.operatorName
        let obj = {
            sl_no: index + 1,
            name: element.name,
            phone: element.phone,
            createdAt: moment(element.createdAt).format('DD-MM-YYYY hh:mm A'),
            amount: element.amount,
            operator: operator,
            operatorRef: operatorRef,
            mobile: element.mobile,
            status: element.status,
            txnId: element.txnId,
            transactionId: element.transactionId,
            apiName: 'Zpay',
            errormessage: element.errormessage
        }
        data.push(obj)
    });

    const response = {
        "draw": draw,
        "iTotalRecords": totalRecords,
        "iTotalDisplayRecords": totalRecordwithFilter,
        "aaData": data
    }
    res.json(response)
}
const oldRechargeList = async (req, res) => {
    const postData = JSON.parse(JSON.stringify(req.body));
    let draw = postData.draw;
    let row = postData.start;

    let rowperpage = postData.length; // Rows display per page
    let columnIndex = postData["order[0][column]"];// Column index
    let columnName = postData['columns[' + columnIndex + '][data]'];// Column name
    if (columnName == "sl_no") {
        columnName = "createdAt"
    }
    let columnSortOrder = postData['order[0][dir]'];// asc or desc
    let searchValue = postData['search[value]']// Search value
    let totalRecords = 0
    let filter = {
        skip: row,
        limit: rowperpage,
        document: columnName,
        sort: columnSortOrder,
        data: { userId: req.params.userId }
    }
    totalRecords = await oldRechargeRecords(searchValue, filter, 'count')
    let totalRecordwithFilter = totalRecords
    let records = await oldRechargeRecords(searchValue, filter, 'records')

    let data = []
    records.forEach((element, index) => {
        let optCode = element.operator || 'N/A'
        let operatorData = operatorConfig.find(e => e.operatorCode === optCode);
        let operatorRef = operatorData.operatorType
        let operator = operatorData.operatorName
        let obj = {
            sl_no: index + 1,
            name: element.name,
            phone: element.phone,
            createdAt: moment(element.createdAt).format('DD-MM-YYYY hh:mm A'),
            amount: element.amount,
            operator: operator,
            operatorRef: operatorRef,
            mobile: element.mobile,
            status: element.status,
            txnId: element.txnId,
            transactionId: element.transactionId,
            apiName: 'Zpay',
            errormessage: element.errormessage
        }
        data.push(obj)
    });

    const response = {
        "draw": draw,
        "iTotalRecords": totalRecords,
        "iTotalDisplayRecords": totalRecordwithFilter,
        "aaData": data
    }
    res.json(response)
}
const pendingRechargeList = async (req, res) => {
    const postData = JSON.parse(JSON.stringify(req.body));
    let draw = postData.draw;
    let row = postData.start;

    let rowperpage = postData.length; // Rows display per page
    let columnIndex = postData["order[0][column]"];// Column index
    let columnName = postData['columns[' + columnIndex + '][data]'];// Column name
    if (columnName == "sl_no") {
        columnName = "createdAt"
    }
    let columnSortOrder = postData['order[0][dir]'];// asc or desc
    let searchValue = postData['search[value]']// Search value
    let totalRecords = 0
    let filter = {
        skip: row,
        limit: rowperpage,
        document: columnName,
        sort: columnSortOrder,
        data: { userId: req.params.userId }
    }
    totalRecords = await pendingRechargeRecords(searchValue, filter, 'count')
    let totalRecordwithFilter = totalRecords
    let records = await pendingRechargeRecords(searchValue, filter, 'records')

    let data = []
    records.forEach((element, index) => {
        let optCode = element.operator || 'N/A'
        let operatorData = operatorConfig.find(e => e.operatorCode === optCode);
        let operatorRef = operatorData.operatorType
        let operator = operatorData.operatorName
        let obj = {
            sl_no: index + 1,
            name: element.name,
            phone: element.phone,
            createdAt: moment(element.createdAt).format('DD-MM-YYYY hh:mm A'),
            amount: element.amount,
            operator: operator,
            operatorRef: operatorRef,
            mobile: element.mobile,
            status: element.status,
            txnId: element.txnId,
            transactionId: element.transactionId,
            apiName: 'Zpay',
            errormessage: element.errormessage
        }
        data.push(obj)
    });

    const response = {
        "draw": draw,
        "iTotalRecords": totalRecords,
        "iTotalDisplayRecords": totalRecordwithFilter,
        "aaData": data
    }
    res.json(response)
}
const walletTransactionList = async (req, res) => {
    const postData = JSON.parse(JSON.stringify(req.body));
    let draw = postData.draw;
    let row = postData.start;

    let rowperpage = postData.length; // Rows display per page
    let columnIndex = postData["order[0][column]"];// Column index
    let columnName = postData['columns[' + columnIndex + '][data]'];// Column name
    if (columnName == 'sl_no') {
        columnName = "createdAt"
    }


    let columnSortOrder = postData['order[0][dir]'];// asc or desc
    let searchValue = postData['search[value]']// Search value
    let totalRecords = 0
    let filter = {
        skip: row,
        limit: rowperpage,
        document: columnName,
        sort: columnSortOrder,
        data: { userId: req.params.userId }
    }
    totalRecords = await walletTransactionRecords(searchValue, filter, 'count')
    let totalRecordwithFilter = totalRecords
    let records = await walletTransactionRecords(searchValue, filter, 'records')
    // totalRecordwithFilter = records.length

    let data = []
    records.forEach((element, index) => {
        let optCode = element.operator || 'N/A'
        let operatorData = operatorConfig.find(e => e.operatorCode === optCode);
        let service = operatorData.operatorType
        let operator = operatorData.operatorName
        let obj = {
            sl_no: index + 1,
            name: element.name,
            phone: element.phone,
            createdAt: moment(element.createdAt).format('DD-MM-YYYY hh:mm A'),
            service: service,
            operator: operator,
            naration: getNaration(element._id, element.naration),
            credit: element.credit,
            debit: element.debit,
            restAmount: element.restAmount || 'Not Calculated'
        }
        data.push(obj)
    });

    const response = {
        "draw": draw,
        "iTotalRecords": totalRecords,
        "iTotalDisplayRecords": totalRecordwithFilter,
        "aaData": data
    }
    res.json(response)
}
const walletBalanceList = async (req, res) => {
    const postData = JSON.parse(JSON.stringify(req.body));
    let draw = postData.draw;
    let row = postData.start;

    let rowperpage = postData.length; // Rows display per page
    let columnIndex = postData["order[0][column]"];// Column index
    let columnName = postData['columns[' + columnIndex + '][data]'];// Column name
    if (columnName == 'sl_no') {
        columnName = "createdAt"
    }

    let columnSortOrder = postData['order[0][dir]'];// asc or desc
    let searchValue = postData['search[value]']// Search value
    let totalRecords = 0
    let filter = {
        skip: row,
        limit: rowperpage,
        document: columnName,
        sort: columnSortOrder,
        data: { userId: req.params.userId }
    }
    totalRecords = await walletBalanceRecords(searchValue, filter, 'count')
    let totalRecordwithFilter = totalRecords
    let records = await walletBalanceRecords(searchValue, filter, 'records')
    // totalRecordwithFilter = records.length

    let data = []
    records.forEach((element, index) => {
        let optCode = element.operator || 'N/A'
        let operatorData = operatorConfig.find(e => e.operatorCode === optCode);
        let service = operatorData.operatorType
        let operator = operatorData.operatorName
        let obj = {
            sl_no: index + 1,
            name: element.name,
            phone: element.phone,
            createdAt: moment(element.createdAt).format('DD-MM-YYYY hh:mm A'),
            service: service,
            operator: operator,
            naration: getNaration(element._id, element.naration),
            credit: element.credit,
            debit: element.debit,
            restAmount: element.restAmount || 'Not Calculated'
        }
        data.push(obj)
    });

    const response = {
        "draw": draw,
        "iTotalRecords": totalRecords,
        "iTotalDisplayRecords": totalRecordwithFilter,
        "aaData": data
    }
    res.json(response)
}

module.exports = { operatorList, userList, userWalletList, todayRechargeList, oldRechargeList, pendingRechargeList, walletTransactionList, getoperatorList, walletBalanceList }