const url = 'https://main-zo6hfspdfa-uc.a.run.app/';
const bearer = 'bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODA2NTg3MDIsImV4cCI6MTcxMjE5NDcyMiwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoianJvY2tldEBleGFtcGxlLmNvbSIsIlVzZXJuYW1lIjoicHJpeWFua2EifQ.ln-9bSIm9Br2u2OJBb5Cft67CpzcRuXcHYTfRTLp3Rk';

////////////////////////////////////////////////////////////////////////
//                          PACKAGE SEARCH                            //
//                        FIX THE HTTP SEARCH                         //
////////////////////////////////////////////////////////////////////////

async function packageSearch() {
    try {
        regex = document.getElementById("searchbar").value
        newurl = url + 'package/byRegEx/';
        var response = await fetch(newurl, {
            method: 'POST',
            headers: {
                'X-Authorization': bearer,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 'RegEx': regex })
        })
        var items = await response.text()
        document.getElementById("return").innerHTML = JSON.stringify(JSON.parse(items));
    } catch (err) {
        document.getElementById("return").innerHTML = "Package not found.";
    }

    /*newurl = url + 'package/byName/' + document.getElementById('searchbar').value + '/';
    var items;
    fetch(newurl, {
        method: 'GET',
        withCredentials: true,
        credentials: 'include',
        headers: {
            'Authorization': bearer,
            'Content-Type': 'application/json'
        }
    }).then(response => {
        items = response;
        document.getElementById("return").innerHTML = items;
    })
    .catch(error => {
        items = error;
        document.getElementById("return").innerHTML = items;
    });
    */

}
////////////////////////////////////////////////////////////////////////
//                          PACKAGE UPLOAD                            //
//  FIX THE HTTP SEARCH AND ADD ALL OF THE RELEVANT FIELDS TO BODY    //
////////////////////////////////////////////////////////////////////////

async function packageUpload() {

    /*newurl = url + 'package/';
    var items = "Upload Failed.";
    fetch(newurl, { //Edit the fields in this section
        method: 'POST',
        body: {
            "Content": document.getElementById("content").value,
            "JSProgram": document.getElementById("js").value
        },
        headers: {
            'Authorization': bearer,
            'Content-Type': 'application/json'
        }
    }).then(responseJson => {
        items = "Upload Successful."
    })
        .catch(error => this.setState({
            isLoading: false,
            message: 'Something bad happened ' + error
        }));
    document.getElementById("return").innerHTML = items;*/
    try {
        var localUrl = document.getElementById("url").value
        var content = document.getElementById("content").value
        if (content === ""){
            content = null
        }
        if (localUrl === ""){
            localUrl = null
        }
        newurl = url + 'package/';
        var response = await fetch(newurl, {
            method: 'POST',
            headers: {
                'X-Authorization': bearer,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 'URL': localUrl, 'Content': content })
        })
        var items = await response.text()
        document.getElementById("return").innerHTML = "Upload Success.";
        
    } catch (err) {
        document.getElementById("return").innerHTML = err;
    }
}

////////////////////////////////////////////////////////////////////////
//                          PACKAGE UPDATE                            //
//  FIX THE HTTP SEARCH AND ADD ALL OF THE RELEVANT FIELDS TO BODY    //
////////////////////////////////////////////////////////////////////////

async function packageUpdate() {
    try {
        var name = document.getElementById("name").value;
        var version = document.getElementById("version").value
        var ID = document.getElementById("ID").value
        var content = document.getElementById("content").value
        var URL = document.getElementById("URL").value
        if (content === ""){
            content = null
        }
        if (URL === ""){
            URL = null
        }
        if (name === ""){
            name = null
        }
        if (ID === ""){
            ID = null
        }
        if (version === ""){
            version = null
        }
        newurl = url + 'package/' + document.getElementById('ID').value + '/';
        var response = await fetch(newurl, {
            method: 'PUT',
            headers: {
                'X-Authorization': bearer,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 'metadata':{'ID': ID, 'Version': version, 'Name': name },'data':{'URL': URL, 'Content': content,}})
        })
        if(response.status == 200){
            var items = await response.text()
            document.getElementById("return").innerHTML = "Update Success.";
        }
        else{
            document.getElementById("return").innerHTML = "Update Failed. Ensure you have the proper fields filled out.";
        }
    } catch (err) {
        document.getElementById("return").innerHTML = err;
    }
}

////////////////////////////////////////////////////////////////////////
//                           SYSTEM RESET                             //
//                       FIX THE HTTP SEARCH                          //
////////////////////////////////////////////////////////////////////////

async function systemReset() {
    try{
        newurl = url + 'reset'
        var response = await fetch(newurl, {
            method: 'DELETE',
            headers: {
                'X-Authorization': bearer,
            },
        })
        var items = await response.text()
        document.getElementById("return").innerHTML = newurl;
    } catch (err) {
        document.getElementById("return").innerHTML = err;
    }
}

////////////////////////////////////////////////////////////////////////
//                          PACKAGE RATE                              //
//                      FIX THE HTTP SEARCH                           //
////////////////////////////////////////////////////////////////////////

async function packageRate() {

    /*newurl = url + 'package/' + document.getElementById('searchbar').value + '/rate/';
    var items;
    fetch(newurl, {
        method: 'GET',
        withCredentials: true,
        credentials: 'include',
        headers: {
            'Authorization': bearer,
            'Content-Type': 'application/json'
        }
    }).then(responseJson => {
        items = JSON.parse(responseJson._bodyInit);
    })
        .catch(error => this.setState({
            isLoading: false,
            message: 'Something bad happened ' + error
        }));
    document.getElementById("return").innerHTML = items;
    */
    try {
        newurl = url + 'package/' + document.getElementById('searchbar').value + '/rate/';
        var response = await fetch(newurl, {
            method: 'GET',
            headers: {
                'X-Authorization': bearer,
                'Content-Type': 'application/json'
            },
        })
        var items = await response.text()
        document.getElementById("return").innerHTML = JSON.stringify(JSON.parse(items));
    } catch (err) {
        document.getElementById("return").innerHTML = err;
    }
}

////////////////////////////////////////////////////////////////////////
//                          PACKAGE DOWNLOAD                          //
//                        FIX THE HTTP SEARCH                         //
////////////////////////////////////////////////////////////////////////

async function packageDownload() {

    try {
        newurl = url + 'package/' + document.getElementById('searchbar').value + '/';
        var response = await fetch(newurl, {
            method: 'GET',
            headers: {
                'X-Authorization': bearer,
                'Content-Type': 'application/json'
            },
        })
        var items = await response.text()
        document.getElementById("return").innerHTML = JSON.stringify(JSON.parse(items));
    } catch (err) {
        document.getElementById("return").innerHTML = err;
    }
}

////////////////////////////////////////////////////////////////////////
//                          PACKAGE DIRECTORY                          //
//                        FIX THE HTTP SEARCH                         //
////////////////////////////////////////////////////////////////////////

async function packageDirect() {

    try {
        var version = document.getElementById("searchbar").value
        var name = document.getElementById("searchbarName").value
        if (version === ""){
            version = null
        }
        if (name === ""){
            name = null
        }
        newurl = url + 'packages/';
        var response = await fetch(newurl, {
            method: 'POST',
            headers: {
                'X-Authorization': bearer,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 'Version': version, 'Name': name })
        })
        var items = await response.text();
        document.getElementById("return").innerHTML = JSON.stringify(JSON.parse(items));
        
    } catch (err) {
        document.getElementById("return").innerHTML = err;
    }
}
