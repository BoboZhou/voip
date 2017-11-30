'use strict';

module.exports = function () {
    return {
        'conversation-list': require('./conversation/list.js'),
        'conversation-3-111': require('./conversation/3-111.js'),
        'conversation-1-222': require('./conversation/1-222.js'),
        'conversation-1-333': require('./conversation/1-333.js'),
        'conversation-messages': require('./conversation/messages.js'),
        'all-star': require('./all-star.js'),
        'org-search': require('./org/search.js'),
        'org-company': require('./org/company.js'),
        'org-dept-product': require('./org/dept-product.js'),
        'org-dept-2b': require('./org/dept-2b.js'),
        'org-dept-hr': require('./org/dept-hr.js'),
        'group-list': require('./group/list.js'),
        'group-members': require('./group/members.js'),
        'friend-list': require('./friend/friend-list.js'),
        'friend-123': require('./friend/123.js'),
        'login': require('./login.js'),
        'user': require('./user.js'),
        'friend-request-list': require('./friend/request-list.js'),
        'friend-search': require('./friend/search.js'),
        'qrcode-login-create': require('./qrcode/create.js'),
        'qrcode-polling': require('./qrcode/polling.js')
    };
}
