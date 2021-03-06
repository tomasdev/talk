import React from 'react';
import cn from 'classnames';
import PropTypes from 'prop-types';
import capitalize from 'lodash/capitalize';
import styles from './UserDetail.css';
import AccountHistory from './AccountHistory';
import { Slot } from 'coral-framework/components';
import UserDetailCommentList from '../components/UserDetailCommentList';
import {
  getReliability,
  isSuspended,
  isBanned,
} from 'coral-framework/utils/user';
import ButtonCopyToClipboard from './ButtonCopyToClipboard';
import ClickOutside from 'coral-framework/components/ClickOutside';
import {
  Icon,
  Drawer,
  Spinner,
  TabBar,
  Tab,
  TabContent,
  TabPane,
} from 'coral-ui';
import ActionsMenu from 'coral-admin/src/components/ActionsMenu';
import ActionsMenuItem from 'coral-admin/src/components/ActionsMenuItem';
import UserInfoTooltip from './UserInfoTooltip';
import t from 'coral-framework/services/i18n';

class UserDetail extends React.Component {
  rejectThenReload = async info => {
    await this.props.rejectComment(info);
    this.props.data.refetch();
  };

  acceptThenReload = async info => {
    await this.props.acceptComment(info);
    this.props.data.refetch();
  };

  bulkAcceptThenReload = async () => {
    await this.props.bulkAccept();
    this.props.data.refetch();
  };

  bulkRejectThenReload = async () => {
    await this.props.bulkReject();
    this.props.data.refetch();
  };

  changeTab = tab => {
    this.props.changeTab(tab);
  };

  showSuspenUserDialog = () =>
    this.props.showSuspendUserDialog({
      userId: this.props.root.user.id,
      username: this.props.root.user.username,
    });

  showBanUserDialog = () =>
    this.props.showBanUserDialog({
      userId: this.props.root.user.id,
      username: this.props.root.user.username,
    });

  renderLoading() {
    return (
      <ClickOutside onClickOutside={this.props.hideUserDetail}>
        <Drawer onClose={this.props.hideUserDetail}>
          <Spinner />
        </Drawer>
      </ClickOutside>
    );
  }

  renderError() {
    return (
      <ClickOutside onClickOutside={this.props.hideUserDetail}>
        <Drawer onClose={this.props.hideUserDetail}>
          <div>{this.props.data.error.message}</div>
        </Drawer>
      </ClickOutside>
    );
  }

  getActionMenuLabel() {
    const { root: { user } } = this.props;

    if (isBanned(user)) {
      return 'Banned';
    } else if (isSuspended(user)) {
      return 'Suspended';
    }

    return '';
  }

  renderLoaded() {
    const {
      data,
      root,
      root: { me, user, totalComments, rejectedComments },
      activeTab,
      selectedCommentIds,
      toggleSelect,
      hideUserDetail,
      viewUserDetail,
      loadMore,
      toggleSelectAll,
      unbanUser,
      unsuspendUser,
      modal,
    } = this.props;

    // if totalComments is 0, you're dividing by zero
    let rejectedPercent = rejectedComments / totalComments * 100;

    if (rejectedPercent === Infinity || isNaN(rejectedPercent)) {
      rejectedPercent = 0;
    }

    const banned = isBanned(user);
    const suspended = isSuspended(user);

    return (
      <ClickOutside onClickOutside={modal ? null : hideUserDetail}>
        <Drawer
          className="talk-admin-user-detail-drawer"
          onClose={hideUserDetail}
        >
          <h3
            className={cn(styles.username, 'talk-admin-user-detail-username')}
          >
            {user.username}
          </h3>

          {user.id && (
            <ActionsMenu
              icon="person"
              className={cn(
                styles.actionsMenu,
                'talk-admin-user-detail-actions-menu'
              )}
              buttonClassNames={cn(
                {
                  [styles.actionsMenuSuspended]: suspended,
                  [styles.actionsMenuBanned]: banned,
                },
                'talk-admin-user-detail-actions-button'
              )}
              label={this.getActionMenuLabel()}
            >
              {suspended ? (
                <ActionsMenuItem onClick={() => unsuspendUser({ id: user.id })}>
                  {t('user_detail.remove_suspension')}
                </ActionsMenuItem>
              ) : (
                <ActionsMenuItem
                  disabled={me.id === user.id}
                  onClick={this.showSuspenUserDialog}
                >
                  {t('user_detail.suspend')}
                </ActionsMenuItem>
              )}

              {banned ? (
                <ActionsMenuItem onClick={() => unbanUser({ id: user.id })}>
                  {t('user_detail.remove_ban')}
                </ActionsMenuItem>
              ) : (
                <ActionsMenuItem
                  disabled={me.id === user.id}
                  onClick={this.showBanUserDialog}
                >
                  {t('user_detail.ban')}
                </ActionsMenuItem>
              )}
            </ActionsMenu>
          )}

          {(banned || suspended) && (
            <UserInfoTooltip
              user={user}
              banned={banned}
              suspended={suspended}
            />
          )}

          <div>
            <ul className={styles.userDetailList}>
              <li>
                <Icon name="assignment_ind" />
                <span className={styles.userDetailItem}>
                  {t('user_detail.member_since')}:
                </span>
                {new Date(user.created_at).toLocaleString()}
              </li>

              {user.profiles.map(({ id }) => (
                <li key={id}>
                  <Icon name="email" />
                  <span className={styles.userDetailItem}>
                    {t('user_detail.email')}:
                  </span>
                  {id}{' '}
                  <ButtonCopyToClipboard
                    className={styles.copyButton}
                    icon="content_copy"
                    copyText={id}
                  />
                </li>
              ))}
            </ul>

            <ul className={styles.stats}>
              <li className={styles.stat}>
                <span className={styles.statItem}>
                  {t('user_detail.total_comments')}
                </span>
                <span className={styles.statResult}>{totalComments}</span>
              </li>
              <li className={styles.stat}>
                <span className={styles.statItem}>
                  {t('user_detail.reject_rate')}
                </span>
                <span className={styles.statResult}>
                  {rejectedPercent.toFixed(1)}%
                </span>
              </li>
              <li className={styles.stat}>
                <span className={styles.statItem}>
                  {t('user_detail.reports')}
                </span>
                <span
                  className={cn(
                    styles.statReportResult,
                    styles[getReliability(user.reliable.flagger)]
                  )}
                >
                  {capitalize(getReliability(user.reliable.flagger))}
                </span>
              </li>
            </ul>
          </div>

          <Slot
            fill="userProfile"
            data={this.props.data}
            queryData={{ root, user }}
          />

          <hr />

          <TabBar
            onTabClick={this.changeTab}
            activeTab={activeTab}
            className={cn(styles.tabBar, 'talk-admin-user-detail-tab-bar')}
            aria-controls="talk-admin-user-detail-content"
            tabClassNames={{
              button: styles.tabButton,
              buttonActive: styles.tabButtonActive,
            }}
          >
            <Tab
              tabId={'all'}
              className={cn(
                styles.tab,
                styles.button,
                'talk-admin-user-detail-all-tab'
              )}
            >
              {t('user_detail.all')}
            </Tab>
            <Tab
              tabId={'rejected'}
              className={cn(styles.tab, 'talk-admin-user-detail-rejected-tab')}
            >
              {t('user_detail.rejected')}
            </Tab>
            <Tab
              tabId={'history'}
              className={cn(
                styles.tab,
                styles.button,
                'talk-admin-user-detail-history-tab'
              )}
            >
              {t('user_detail.account_history')}
            </Tab>
          </TabBar>

          <TabContent
            activeTab={activeTab}
            className="talk-admin-user-detail-content"
          >
            <TabPane
              tabId={'all'}
              className={'talk-admin-user-detail-all-tab-pane'}
            >
              <UserDetailCommentList
                user={user}
                root={root}
                data={data}
                loadMore={loadMore}
                toggleSelect={toggleSelect}
                viewUserDetail={viewUserDetail}
                acceptComment={this.acceptThenReload}
                rejectComment={this.rejectThenReload}
                selectedCommentIds={selectedCommentIds}
                toggleSelectAll={toggleSelectAll}
                bulkAcceptThenReload={this.bulkAcceptThenReload}
                bulkRejectThenReload={this.bulkRejectThenReload}
              />
            </TabPane>
            <TabPane
              tabId={'rejected'}
              className={'talk-admin-user-detail-rejected-tab-pane'}
            >
              <UserDetailCommentList
                user={user}
                root={root}
                data={data}
                loadMore={loadMore}
                toggleSelect={toggleSelect}
                viewUserDetail={viewUserDetail}
                acceptComment={this.acceptThenReload}
                rejectComment={this.rejectThenReload}
                selectedCommentIds={selectedCommentIds}
                toggleSelectAll={toggleSelectAll}
                bulkAcceptThenReload={this.bulkAcceptThenReload}
                bulkRejectThenReload={this.bulkRejectThenReload}
              />
            </TabPane>
            <TabPane
              tabId={'history'}
              className={'talk-admin-user-detail-history-tab-pane'}
            >
              <AccountHistory user={user} />
            </TabPane>
          </TabContent>
        </Drawer>
      </ClickOutside>
    );
  }

  render() {
    if (this.props.data.error) {
      return this.renderError();
    }

    if (this.props.loading) {
      return this.renderLoading();
    }
    return this.renderLoaded();
  }
}

UserDetail.propTypes = {
  userId: PropTypes.string.isRequired,
  hideUserDetail: PropTypes.func.isRequired,
  root: PropTypes.object.isRequired,
  acceptComment: PropTypes.func.isRequired,
  rejectComment: PropTypes.func.isRequired,
  changeTab: PropTypes.func.isRequired,
  toggleSelect: PropTypes.func.isRequired,
  bulkAccept: PropTypes.func.isRequired,
  bulkReject: PropTypes.func.isRequired,
  toggleSelectAll: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  data: PropTypes.shape({
    refetch: PropTypes.func.isRequired,
  }),
  activeTab: PropTypes.string.isRequired,
  selectedCommentIds: PropTypes.array.isRequired,
  viewUserDetail: PropTypes.any.isRequired,
  loadMore: PropTypes.any.isRequired,
  showSuspendUserDialog: PropTypes.func,
  showBanUserDialog: PropTypes.func,
  unbanUser: PropTypes.func.isRequired,
  unsuspendUser: PropTypes.func.isRequired,
  modal: PropTypes.bool,
};

export default UserDetail;
