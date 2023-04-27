const url = 'https://main-zo6hfspdfa-uc.a.run.app/';
const bearer = 'bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODA2NTg3MDIsImV4cCI6MTcxMjE5NDcyMiwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoianJvY2tldEBleGFtcGxlLmNvbSIsIlVzZXJuYW1lIjoicHJpeWFua2EifQ.ln-9bSIm9Br2u2OJBb5Cft67CpzcRuXcHYTfRTLp3Rk';

////////////////////////////////////////////////////////////////////////
//                          PACKAGE SEARCH                            //
//                        FIX THE HTTP SEARCH                         //
////////////////////////////////////////////////////////////////////////

function packageSearch(){

    newurl = url + 'package/byName/' + document.getElementById('searchbar').value + '/';
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
    
}
////////////////////////////////////////////////////////////////////////
//                          PACKAGE UPLOAD                            //
//  FIX THE HTTP SEARCH AND ADD ALL OF THE RELEVANT FIELDS TO BODY    //
////////////////////////////////////////////////////////////////////////

function packageUpload(){

    newurl = url + 'package/';
    var items = "Upload Failed.";
    fetch(newurl, { //Edit the fields in this section
        method: 'POST',
        body: {
            "Content": document.getElementById("content").value,
            "JSProgram": document.getElementById("js").value
        },
        withCredentials: true,
        credentials: 'include',
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
    document.getElementById("return").innerHTML = items;
}

////////////////////////////////////////////////////////////////////////
//                          PACKAGE UPDATE                            //
//  FIX THE HTTP SEARCH AND ADD ALL OF THE RELEVANT FIELDS TO BODY    //
////////////////////////////////////////////////////////////////////////

function packageUpdate(){

    newurl = url + 'package/' + document.getElementById('searchBar') + '/';
    var items = "Update Successful.";
    fetch(newurl, { 
        body: {
            "metadata": {
                "Name": document.getElementById("name").value,
                "Version": document.getElementById("version").value,
                "ID": document.getElementById("ID").value
            },
            "data": {
                "Content": document.getElementById("content").value,
                "URL": document.getElementById("URL").value,
                "JSProgram": document.getElementById("JSProgram").value
            }
        },
        method: 'PUT',
        withCredentials: true,
        credentials: 'include',
        headers: {
            'Authorization': bearer,
            'Content-Type': 'application/json'
        }
    })
    .catch(error => this.setState({
        isLoading: false,
        message: 'Something bad happened ' + error
    }));
    document.getElementById("return").innerHTML = items;
}

////////////////////////////////////////////////////////////////////////
//                           SYSTEM RESET                             //
//                       FIX THE HTTP SEARCH                          //
////////////////////////////////////////////////////////////////////////

function systemReset(){

    newurl = url + 'reset/'
    var items = "System has been reset!";
    fetch(newurl, { 
        method: 'DELETE',
        withCredentials: true,
        credentials: 'include',
        headers: {
            'Authorization': bearer,
            'Content-Type': 'application/json'
        }
    }).catch(error => this.setState({
        isLoading: false,
        message: 'Something bad happened ' + error
    }));
    document.getElementById("return").innerHTML = items;
}

////////////////////////////////////////////////////////////////////////
//                          PACKAGE RATE                              //
//                      FIX THE HTTP SEARCH                           //
////////////////////////////////////////////////////////////////////////

function packageRate(){

    newurl = url + 'package/' + document.getElementById('searchbar').value + '/rate/';
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
}

////////////////////////////////////////////////////////////////////////
//                          PACKAGE DOWNLOAD                          //
//                        FIX THE HTTP SEARCH                         //
////////////////////////////////////////////////////////////////////////

function packageDownload(){

    newurl = url + 'package/' + document.getElementById('searchbar').value + '/';
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
}

////////////////////////////////////////////////////////////////////////
//                          PACKAGE DIRECTORY                          //
//                        FIX THE HTTP SEARCH                         //
////////////////////////////////////////////////////////////////////////

function packageDirect(){

    newurl = url + 'packages/';
    var items;
    fetch(newurl, {
        method: 'POST',
        body: {
            "Version": document.getElementById("searchbar").value,
            "Name": document.getElementById("searchbarName").value,
        },
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
}