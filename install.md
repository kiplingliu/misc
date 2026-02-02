# fresh install

## wsl

### installation

- install packages in `apt-packages.txt` (TODO: automated?)
- install [rust](https://www.rust-lang.org/tools/install) with `rustup` (changes `~/.bashrc`)
- install [node.js](https://nodejs.org/en/download) with `fnm` (changes `~/.bashrc`)
- install [fzf](https://github.com/junegunn/fzf?tab=readme-ov-file#using-git) (changes `~/.bashrc`)
- install [uv](https://docs.astral.sh/uv/)
- install [lazygit](https://github.com/jesseduffield/lazygit?tab=readme-ov-file#installation) (TODO: which way?)
- install [docker](https://docs.docker.com/engine/install/ubuntu/#install-using-the-repository) and follow [post-installation](https://docs.docker.com/engine/install/linux-postinstall/)

### backup

- Get the backup from mega using `rclone`

### script

```bash
ln -s $(which fdfind) ~/.local/bin/fd

mkdir ~/Proj && cd ~/Proj && git clone https://github.com/kiplingliu/misc
ln -s ~/Proj/misc/bin ~/bin
ln -s ~/Proj/misc/.bashrc_public ~/.bashrc_public
ln -s ~/Proj/misc/.gitconfig ~/.gitconfig
cat <<'EOF' >~/.inputrc
set editing-mode vi
set show-mode-in-prompt on
EOF
cat <<'EOF' >>~/.bashrc
if [[ -f ~/.bashrc_public ]]; then . ~/.bashrc_public; fi
EOF

# Daily backup service
mkdir -p ~/.config/systemd/user
ln -s ~/Proj/misc/daily-backup.service ~/.config/systemd/user/daily-backup.service
ln -s ~/Proj/misc/daily-backup.timer ~/.config/systemd/user/daily-backup.timer
systemctl --user daemon-reload
systemctl --user enable --now daily-backup.timer
```

## windows (TODO)

- in cmd, run `setx WSLENV "%WSLENV%:USERPROFILE/up"`, then restart WSL
